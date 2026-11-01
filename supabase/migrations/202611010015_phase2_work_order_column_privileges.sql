-- Privilegios por columna para impedir cambios directos a folios, relaciones e importes calculados.
revoke update on public.ordenes_trabajo from authenticated;
grant update(estado,prioridad,fecha_prometida,kilometraje_ingreso,nivel_combustible,sintomas,observaciones_recepcion,accesorios,danos_preexistentes,diagnostico,trabajo_solicitado,notas_internas,autorizado_por,autorizado_at,fecha_inicio,fecha_termino,fecha_entrega,entregado_por) on public.ordenes_trabajo to authenticated;
revoke update on public.ot_tareas from authenticated;
grant update(estado,fecha_inicio,fecha_termino,horas_reales) on public.ot_tareas to authenticated;
revoke update on public.ot_asignaciones from authenticated;
grant update(activa) on public.ot_asignaciones to authenticated;
revoke update on public.ot_tiempos from authenticated;
grant update(termino,descripcion) on public.ot_tiempos to authenticated;
revoke update on public.ot_inspecciones from authenticated;
grant update(items,resultado,observaciones,revisado_por,revisado_at) on public.ot_inspecciones to authenticated;
revoke update on public.ot_pagos from authenticated;
grant update(monto,metodo,referencia,observaciones) on public.ot_pagos to authenticated;
revoke update on public.ot_adjuntos from authenticated;