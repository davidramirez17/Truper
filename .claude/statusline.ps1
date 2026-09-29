# Statusline compacta: modelo | costo autoritativo | duracion | contexto.
#
# - Usa cost.total_cost_usd del harness; no recalcula precios.
# - Lee solo una cola acotada del transcript y no imprime su contenido.
# - Calcula contexto con input + cache read + cache creation.
# - NO suma output_tokens: la salida no forma parte del contexto de entrada del
#   mismo mensaje y sumarla infla el indicador operativo.
# - Nunca muestra rutas, prompts, secretos ni payloads del transcript.

$ErrorActionPreference = 'Stop'
$Fallback = 'statusline: (sin datos)'
$MaxTranscriptTailLines = 1000

function Convert-ToNullableDouble {
    param($Value)

    if ($null -eq $Value) { return $null }

    $parsed = 0.0
    if ([double]::TryParse(
        [string]$Value,
        [Globalization.NumberStyles]::Float,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref]$parsed
    )) {
        return $parsed
    }

    return $null
}

function Get-SafeModelName {
    param($Payload)

    $name = [string]$Payload.model.display_name
    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = [string]$Payload.model.id
    }
    if ([string]::IsNullOrWhiteSpace($name)) {
        return 'modelo n/d'
    }

    # Evita que caracteres de control rompan la linea.
    return ($name -replace '[\x00-\x1F\x7F|]', ' ').Trim()
}

function Format-Cost {
    param($Value)

    $cost = Convert-ToNullableDouble $Value
    if ($null -eq $cost -or $cost -lt 0) { return '$-' }

    if ($cost -lt 0.01) {
        return ('$' + $cost.ToString('0.0000', [Globalization.CultureInfo]::InvariantCulture))
    }

    return ('$' + $cost.ToString('0.00', [Globalization.CultureInfo]::InvariantCulture))
}

function Format-Duration {
    param($Milliseconds)

    $ms = Convert-ToNullableDouble $Milliseconds
    if ($null -eq $ms -or $ms -lt 0) { return 'duracion n/d' }

    $seconds = $ms / 1000.0
    if ($seconds -lt 60) {
        return ('{0:0}s' -f $seconds)
    }
    if ($seconds -lt 3600) {
        return ('{0:0.0} min' -f ($seconds / 60.0))
    }
    if ($seconds -lt 86400) {
        return ('{0:0.0} h' -f ($seconds / 3600.0))
    }

    return ('{0:0.0} d' -f ($seconds / 86400.0))
}

function Get-ContextTokens {
    param([string]$TranscriptPath)

    if ([string]::IsNullOrWhiteSpace($TranscriptPath)) { return $null }
    if (-not [IO.File]::Exists($TranscriptPath)) { return $null }

    # Get-Content -Tail evita cargar el transcript completo en memoria.
    $lines = @(Get-Content -LiteralPath $TranscriptPath -Tail $MaxTranscriptTailLines -ErrorAction Stop)

    for ($index = $lines.Count - 1; $index -ge 0; $index--) {
        $line = [string]$lines[$index]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }

        try {
            $record = $line | ConvertFrom-Json -Depth 30
            $usage = $record.message.usage
            if ($null -eq $usage) { continue }

            $inputTokens = [long]($usage.input_tokens ?? 0)
            $cacheRead = [long]($usage.cache_read_input_tokens ?? 0)
            $cacheCreation = [long]($usage.cache_creation_input_tokens ?? 0)
            $total = $inputTokens + $cacheRead + $cacheCreation

            if ($total -ge 0) { return $total }
        }
        catch {
            # Una linea parcial o de otro tipo no invalida el transcript.
            continue
        }
    }

    return $null
}

function Format-Tokens {
    param(
        $Tokens,
        [bool]$Exceeds200K
    )

    if ($null -eq $Tokens) {
        $result = 'contexto n/d'
    }
    else {
        $value = [long]$Tokens
        if ($value -ge 1000000) {
            $result = ('{0:0.00}M ctx' -f ($value / 1000000.0))
        }
        elseif ($value -ge 1000) {
            $result = ('{0:0.0}k ctx' -f ($value / 1000.0))
        }
        else {
            $result = "$value ctx"
        }
    }

    if ($Exceeds200K) { $result += ' >200k' }
    return $result
}

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        $Fallback
        exit 0
    }

    $payload = $raw | ConvertFrom-Json -Depth 30
    $model = Get-SafeModelName -Payload $payload
    $cost = Format-Cost -Value $payload.cost.total_cost_usd
    $duration = Format-Duration -Milliseconds $payload.cost.total_duration_ms
    $tokens = Get-ContextTokens -TranscriptPath ([string]$payload.transcript_path)
    $context = Format-Tokens -Tokens $tokens -Exceeds200K ($payload.exceeds_200k_tokens -eq $true)

    "$model | $cost | $duration | $context"
}
catch {
    # La statusline no debe interrumpir la sesion ni exponer el payload.
    $Fallback
}

exit 0
