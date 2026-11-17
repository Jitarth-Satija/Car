package com.roadready.app;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/* Heavy files (assets, assets_lite, sounds, lib) are read from inside the APK first.
   If a file is not in the APK, the request goes on to the website as normal. */
public class MainActivity extends BridgeActivity {
  private static final String[] DIRS = {"/assets/", "/assets_lite/", "/sounds/", "/lib/"};

  private static String mime(String p) {
    String s = p.toLowerCase();
    if (s.endsWith(".glb")) return "model/gltf-binary";
    if (s.endsWith(".mp3")) return "audio/mpeg";
    if (s.endsWith(".wav")) return "audio/wav";
    if (s.endsWith(".ogg")) return "audio/ogg";
    if (s.endsWith(".js")) return "application/javascript";
    if (s.endsWith(".json")) return "application/json";
    if (s.endsWith(".png")) return "image/png";
    if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "image/jpeg";
    if (s.endsWith(".bin")) return "application/octet-stream";
    return "application/octet-stream";
  }

  @Override
  public void onCreate(Bundle b) {
    super.onCreate(b);
    WebView wv = getBridge().getWebView();
    wv.setWebViewClient(new BridgeWebViewClient(getBridge()) {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        try {
          String p = r.getUrl().getPath();
          if (p != null && "GET".equals(r.getMethod())) {
            for (String d : DIRS) {
              if (p.startsWith(d)) {
                InputStream in = getAssets().open("local" + p);
                Map<String, String> h = new HashMap<>();
                h.put("Access-Control-Allow-Origin", "*");
                return new WebResourceResponse(mime(p), null, 200, "OK", h, in);
              }
            }
          }
        } catch (Exception e) { /* not in APK -> use the website */ }
        return super.shouldInterceptRequest(v, r);
      }
    });
  }
}
