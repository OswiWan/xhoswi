# Videos HLS

Cada video debe estar en su propia carpeta con un archivo `index.m3u8` y los segmentos `.ts`.

Estructura esperada:

```
videos/
├── big-buck-bunny/
│   ├── index.m3u8
│   ├── segment000.ts
│   ├── segment001.ts
│   └── ...
└── mi-video/
    ├── index.m3u8
    └── segmentXXX.ts
```

## Cómo generar HLS desde un archivo MP4 con FFmpeg

```bash
ffmpeg -i entrada.mp4 \
  -codec: copy -start_number 0 -hls_time 10 \
  -hls_list_size 0 -f hls index.m3u8
```

## Videos de prueba públicos (HLS)

Puedes probar el reproductor apuntando a URLs HLS públicas:

- https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
- https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
