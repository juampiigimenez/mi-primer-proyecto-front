# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [No Publicado]

### Agregado
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
- Modelos de datos con SQLAlchemy para transacciones
- Esquemas de validación con Pydantic
- Base de datos SQLite para persistencia
- Configuración de CORS para permitir peticiones desde el frontend
- Documentación automática con Swagger UI en `/docs`
- Soporte para tipos de transacción: ingresos y gastos
- Campos: monto, tipo, descripción y timestamp automático

### Técnico
- Framework: FastAPI
- ORM: SQLAlchemy
- Validación: Pydantic
- Base de datos: SQLite
- Servidor de desarrollo: Uvicorn
