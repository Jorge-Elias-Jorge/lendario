# Fixtures de exportação offline

Vídeos sintéticos de dois segundos, 320 × 240, 12 fps. Nenhum ficheiro contém imagens de pessoas ou conteúdo do utilizador.

- `audio.mp4`: imagem preta H.264 e tom AAC de 440 Hz.
- `silent.mp4`: o mesmo vídeo, sem faixa de áudio.
- `portrait.mp4`: vídeo e áudio originais com matriz de rotação de 90 graus no contentor.

As legendas brancas nos testes permitem verificar objetivamente os pixels da composição. Estes assets são copiados para `androidTest`, nunca para o APK de produção.

Comandos de geração, usando FFmpeg 8 no ambiente de desenvolvimento:

```bash
ffmpeg -y -f lavfi -i color=c=black:s=320x240:r=12:d=2 -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest audio.mp4
ffmpeg -y -i audio.mp4 -an -c:v copy silent.mp4
ffmpeg -y -display_rotation:v:0 90 -i audio.mp4 -c copy portrait.mp4
```

O teste e o aplicativo não executam FFmpeg. Os MP4 já estão incluídos para execução offline e reprodução do teste.
