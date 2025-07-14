import { createServer } from "http"
import { WebSocketServer } from "ws"
import { watch } from "chokidar"
import { readFile } from '../utils/fs'
import { join } from "path"
import chalk from 'chalk';

import type { Compiler } from "../compiler/Compiler.js"


export interface DevServerOptions {
    port: number;
    hot?: boolean;
    open?: boolean;
}

export class DevServer {
    private compiler?: Compiler
    private options: DevServerOptions
    private wss?: WebSocketServer
    private server?: any

    constructor(
        compiler: Compiler,
        options: DevServerOptions
    ) {
        this.compiler = compiler
        this.options = options
    }

    async start(): Promise<void> {
        // 创建HTTP服务器
        this.server = createServer(async (req, res) => {
            await this.handleRequest(req, res)
        })

        // 创建ws服务器
        if (this.options.hot) {
            this.wss = new WebSocketServer({ server: this.server })
            this.setupHMR()
        }

        // 监听文件变化
        this.setupFileWatcher()

        // 启动服务器
        await new Promise<void>((resolve) => {
            this.server.listen(this.options.port, () => {
                console.log(chalk.green(`✅ Dev server running at http://localhost:${this.options.port}`));
                resolve()
            })
        })
    }

    private async handleRequest(req: any, res: any): Promise<void> {
        const url = req.url === '/' ? 'index.html' : req.url

        try {
            if (url.endsWith('.js')) {
                // 处理js文件
                const stats = await this.compiler?.run()
                const filename = url.slice(1)

                if (stats?.compilation.assets.has(filename)) {
                    const content = stats.compilation.assets.get(filename)
                    res.setHeader('Content-Type', 'application/javascript')
                    res.end(content)
                } else {
                    res.statusCode = 404
                    res.end('Not Found')
                }
            } else if (url.endsWith('.html')) {
                const html = await this.generateHTML()
                res.setHeader('Content-Type', 'text/html')
                res.end(html)
            } else {
                try {
                    const filePath = join(process.cwd(), 'public', url)
                    const content = await readFile(filePath)
                    res.end(content)
                } catch (error) {
                    res.statusCode = 404
                    res.end('Not Found')
                }
            }
        } catch (error) {
            console.error('Server error: ', error)
            res.statusCode = 500
            res.end('Internal Server Error.')
        }
    }

    private async generateHTML(): Promise<string> {
        const stats = await this.compiler?.run();
        const jsFiles = Array.from(stats!.compilation.assets.keys())
            .filter(file => file.endsWith('.js'));

        const hmrScript = this.options.hot ? `
          <script>
            const ws = new WebSocket('ws://localhost:${this.options.port}');
            ws.onmessage = function(event) {
              const data = JSON.parse(event.data);
              if (data.type === 'reload') {
                location.reload();
              }
            };
          </script>
        ` : '';

        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Splitting Webpack Dev Server</title>
    </head>
    <body>
      <div id="app">Loading...</div>
      ${jsFiles.map(file => `<script src="/${file}"></script>`).join('\n  ')}
      ${hmrScript}
    </body>
    </html>
    `
    }

    private setupHMR(): void {
        this.wss?.on('connection', (ws) => {
            console.log('Client connected to HMR')

            ws.on("close", () => {
                console.log('Client disconnected from HMR')
            })
        })
    }

    private setupFileWatcher(): void {
        const watcher = watch('src/**/**', { ignored: /node_modules/ })

        watcher.on('change', async (path) => {
            console.log(chalk.yellow(`📁 File changed: ${path}`))

            try {
                await this.compiler?.run()
                console.log(chalk.green('✅ Rebuild completed'))

                // 通知客户端重新加载
                if (this.wss) {
                    this.wss.clients.forEach((client) => {
                        if (client.readyState === 1) { // WebSocket.OPEN
                            client.send(JSON.stringify({ type: 'reload' }))
                        }
                    });
                }
            } catch (error) {
                console.error(chalk.red('❌ Rebuild failed:'), error)
            }
        })
    }

    async stop(): Promise<void> {
        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server.close(() => resolve());
            })
        }

        if (this.wss) {
            this.wss.close();
        }
    }
}