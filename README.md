# Mix Shary

Editor web para preparar mixes de coreografía y presentaciones: recorte de pistas, ordenamiento, fades, automatización de efectos, ajuste de tempo, Auto Gain, monitor FFT y exportación WAV de alta calidad.

## Aplicación online

La aplicación se publica automáticamente con GitHub Actions en GitHub Pages después de cada cambio enviado a `main`.

Las canciones no forman parte del repositorio. En la versión online, usa **Subir canciones** para cargar tus archivos desde el computador. El audio se conserva en el almacenamiento local del navegador y no se envía a GitHub ni a ningún servidor.

## Uso

1. Abre la aplicación.
2. Pulsa **Nuevo** junto a **Sesiones**, escribe el nombre del proyecto y elige su duración. Cada proyecto mantiene por separado sus pistas, marcadores, automatizaciones, zoom, paneles y punto de reproducción.
3. Pulsa **Subir canciones** para añadir tus archivos de audio.
4. Selecciona un bloque y usa **Reemplazar por mi archivo original** cuando quieras vincular una canción a una pista existente.
5. Ordena, corta, alinea, aplica fades y efectos. El editor guarda automáticamente los cambios en este navegador.
6. Pulsa **Guardar estado exacto** para crear un punto manual al que puedas volver sin afectar los otros proyectos.
7. Pulsa **Igualar nivel** para equilibrar los fragmentos.
8. Exporta el resultado final con **Exportar WAV 24-bit**.

## Mover una sesión a otro computador

1. Abre la sesión que quieras trasladar.
2. Pulsa **Empaquetar sesión** en la barra lateral.
3. Guarda el archivo `.mixshary`. El paquete contiene la sesión, pistas, audio local, marcadores, efectos, automatizaciones, punto exacto y disposición de la interfaz.
4. En el otro computador, abre la aplicación y pulsa **Abrir paquete**.

El paquete se construye localmente en el navegador: no sube el audio a GitHub ni a un servidor. Guárdalo como un archivo privado, porque incluye una copia de las canciones usadas por esa sesión.

## Desarrollo local

Es una aplicación estática sin dependencias de compilación. Sirve la carpeta raíz con cualquier servidor HTTP y abre `/ui/`.

## Privacidad y derechos de autor

El repositorio contiene únicamente el editor y los metadatos visuales de las sesiones. Los archivos de audio personales, las canciones comerciales y los renders están excluidos deliberadamente.
