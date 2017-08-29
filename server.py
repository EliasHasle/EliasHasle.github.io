#I use this for localhost testing of certain web features that don't run locally,
#such as webcam access (and local file access, unless the browser can be tweaked).

import http.server
#handler=http.server.CGIHTTPRequestHandler
#server=http.server.HTTPServer(('127.0.0.1', 8080),handler)
#server.serve_forever()

http.server.HTTPServer(('127.0.0.1', 8080),http.server.CGIHTTPRequestHandler).serve_forever()
