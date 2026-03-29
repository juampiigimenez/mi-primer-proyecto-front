# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [No Publicado]

### Agregado
- **Integración completa con backend de importación de Mercado Pago**
  - Nueva pestaña "Importar Mercado Pago" con navegación por tabs
  - Área de carga de archivos con drag & drop funcional
  - Soporte para archivos CSV y Excel de Mercado Pago
  - Validación de tipo y tamaño de archivo (máx 50MB)
  - Integración con endpoint `/api/v1/imports/upload` del backend
  - Visualización de resultados con KPIs (total, procesadas, duplicadas, fallidas, revisar)
  - Tabla completa de transacciones importadas con:
    - Fecha de operación
    - Descripción y comercio normalizado
    - Monto, moneda y tipo de transacción
    - Categoría sugerida automáticamente
    - Estado (confirmada, pendiente, duplicada, ignorada)
    - Método de pago
  - Badges de colores para tipos y estados de transacciones
  - Manejo robusto de errores con mensajes claros
  - Estados de carga visual (spinner)
  - Scroll automático a resultados después de importación
  - Diseño responsive y consistente con el tema oscuro
- Frontend completo en HTML, CSS y JavaScript puro para la aplicación de finanzas personales
- Diseño moderno con tema oscuro y efectos visuales profesionales
- Balance total destacado con indicador visual de estado (positivo/negativo)
- Formulario interactivo para agregar ingresos y gastos
- Lista de transacciones con código de colores y ordenamiento cronológico
- Gráfico de torta personalizado (Canvas) mostrando proporción de ingresos vs gastos
- Integración completa con API REST en http://127.0.0.1:8000
- Diseño responsive que se adapta a dispositivos móviles
- Mensajes de éxito y error para feedback del usuario
- Formateo de moneda en español argentino

## [0.2.0] - 2026-03-28

### Corregido
- Compatibilidad con Pydantic v2
- Actualización de sintaxis de modelos para usar ConfigDict en lugar de clase Config deprecada
- Migración de `orm_mode` a `from_attributes` según nuevas convenciones de Pydantic v2
- Ajustes en la definición de modelos para cumplir con las validaciones de Pydantic v2

### Cambiado
- Modernización del código base para usar las últimas versiones de dependencias

## [0.1.0] - 2026-03-27

### Agregado
- API REST inicial con FastAPI
- Endpoints para gestión de transacciones financieras:
  - `GET /transactions` - Listar todas las transacciones
  - `POST /transactions` - Crear nueva transacción
  - `GET /transactions/{id}` - Obtener transacción específica
  - `PUT /transactions/{id}` - Actualizar transacción existente
  - `DELETE /transactions/{id}` - Eliminar transacción
- Modelos de datos con Pydantic para validación de transacciones
- Almacenamiento en archivo JSON local (`transacciones.json`)
- Gestión de IDs autoincrementales para transacciones
- Configuración de CORS para permitir peticiones desde el frontend
- Documentación automática con Swagger UI en `/docs`
- Soporte para tipos de transacción: ingresos y gastos
- Campos: id, monto, tipo, descripción y fecha con timestamp automático

### Técnico
- Framework: FastAPI
- Validación: Pydantic
- Persistencia: Archivo JSON local
- Servidor de desarrollo: Uvicorn
- Sin base de datos SQL ni ORM
