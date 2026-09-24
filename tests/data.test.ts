import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRows } from '../src/modules/sources/validation';
import { csvText, selectAnalytics } from '../src/modules/analytics/selectors';
import { importSchema } from '../src/modules/platform/contracts';

test('columnas personalizadas, fecha inválida y precisión monetaria',()=>{
  const result=validateRows(['Cuenta','Día','Pesos','Territorio'],[['Cliente','2026-09-22',1250.35,'Centro'],['Cliente','2026-02-30',10.333,'Centro']],{Cliente:0,Fecha:1,Importe:2,'Zona de ventas':3});
  assert.equal(result.valid,1);assert.equal(result.invalid,1);assert.equal(result.rows[0].amount,1250.35);assert.equal(result.rows[1].errors.length,2);
});
test('no permite mapear dos campos a la misma columna ni guardar solo parte de una carga',()=>{
  const duplicate=validateRows(['A','B','C'],[['Cliente','2026-09-22',10]],{Cliente:0,Fecha:1,Importe:2,'Zona de ventas':0});
  assert.ok(duplicate.missing.length>0);
  const large=validateRows(['Cliente','Fecha','Importe','Zona de ventas'],Array.from({length:10001},()=>['A','2026-09-22',10,'Centro']));
  assert.equal(large.limited,true);assert.equal(large.rows.length,10000);
});
test('los datos validados no se truncan a las 50 filas de vista previa',()=>{
  const data=validateRows(['Cliente','Fecha','Importe','Zona de ventas'],Array.from({length:75},()=>['A','2026-09-22',10,'Centro']));
  assert.equal(data.rows.length,75);assert.equal(data.valid,75);
});
test('indicadores en centavos, filtros y comparación de periodos iguales',()=>{
  const rows=[{id:'1',projectId:'a',date:'2026-09-22',client:'A',region:'Norte',amountCents:100},{id:'2',projectId:'a',date:'2026-09-15',client:'A',region:'Norte',amountCents:50},{id:'3',projectId:'b',date:'2026-09-22',client:'B',region:'Sur',amountCents:900}];
  const analytics=selectAnalytics(rows,'2026-09-22',7,'a');assert.equal(analytics.total,100);assert.equal(analytics.previousTotal,50);assert.equal(analytics.change,100);assert.equal(analytics.current.length,1);
  const empty=selectAnalytics([],'2026-09-22',7);assert.equal(empty.average,null);assert.equal(empty.change,null);
});
test('CSV exportado neutraliza fórmulas y conserva comillas',()=>{
  const text=csvText([{id:'1',projectId:'a',date:'2026-09-22',client:'=HYPERLINK("bad")',region:'Norte',amountCents:105}]);
  assert.ok(text.includes("'=HYPERLINK"));assert.ok(text.includes('""bad""'));assert.ok(text.includes('1.05'));
});
test('el contrato del servidor rechaza fechas imposibles y cantidades fuera de rango',()=>{
  const input={projectId:'10000000-0000-4000-8000-000000000001',requestId:'10000000-0000-4000-8000-000000000002',filename:'a.xlsx',records:[{date:'2026-02-30',client:'A',region:'B',amountCents:1.5}]};
  assert.equal(importSchema.safeParse(input).success,false);
});
