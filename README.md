# Mix Shary

Editor web para preparar mixes de coreografía y presentaciones: recorte de pistas, ordenamiento, fades, automatización de efectos, ajuste de tempo, Auto Gain, monitor FFT y exportación WAV de alta calidad.

## Aplicación online

La aplicación se publica automáticamente con GitHub Actions en GitHub Pages después de cada cambio enviado a `main`.

Las canciones no forman parte del repositorio. En la versión online, usa **Subir canciones** para cargar tus archivos desde el computador. El audio se conserva en el almacenamiento local del navegador y no se envía a GitHub ni a ningún servidor.

## Uso

1. Abre la aplicación.
2. Pulsa **Subir canciones** para añadir tus archivos de audio.
3. Selecciona un bloque y usa **Reemplazar por mi archivo original** cuando quieras vincular una canción a una pista existente.
4. Ordena, corta, alinea, aplica fades y efectos.
5. Pulsa **Igualar nivel** para equilibrar los fragmentos.
6. Exporta el resultado con **Exportar WAV 24-bit**.

## Desarrollo local

Es una aplicación estática sin dependencias de compilación. Sirve la carpeta raíz con cualquier servidor HTTP y abre `/ui/`.

## Privacidad y derechos de autor

El repositorio contiene únicamente el editor y los metadatos visuales de las sesiones. Los archivos de audio personales, las canciones comerciales y los renders están excluidos deliberadamente.
