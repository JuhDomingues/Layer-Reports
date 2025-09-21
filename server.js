const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Gerar certificado auto-assinado
const generateSelfSignedCert = () => {
    return new Promise((resolve, reject) => {
        const certPath = path.join(__dirname, 'cert.pem');
        const keyPath = path.join(__dirname, 'key.pem');
        
        // Verificar se já existem
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            console.log('✅ Certificados encontrados');
            resolve({ cert: certPath, key: keyPath });
            return;
        }
        
        console.log('🔧 Gerando certificado auto-assinado...');
        const command = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=BR/ST=SP/L=São Paulo/O=Dev/CN=localhost"`;
        
        exec(command, (error) => {
            if (error) {
                console.error('❌ Erro ao gerar certificado:', error);
                reject(error);
                return;
            }
            console.log('✅ Certificado gerado com sucesso');
            resolve({ cert: certPath, key: keyPath });
        });
    });
};

// Servir arquivos estáticos
const serveFile = (req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Arquivo não encontrado');
        return;
    }
    
    // Determinar Content-Type
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    
    const contentType = contentTypes[ext] || 'text/plain';
    
    // Ler e servir arquivo
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Erro interno do servidor');
            return;
        }
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
};

// Iniciar servidor
const startServer = async () => {
    try {
        const { cert, key } = await generateSelfSignedCert();
        
        const options = {
            key: fs.readFileSync(key),
            cert: fs.readFileSync(cert)
        };
        
        const server = https.createServer(options, serveFile);
        
        const PORT = 8443;
        server.listen(PORT, () => {
            console.log(`🚀 Servidor HTTPS rodando em: https://localhost:${PORT}`);
            console.log('⚠️  IMPORTANTE: Aceite o certificado auto-assinado no navegador');
            console.log('📋 Para conectar API real:');
            console.log('   1. Acesse https://localhost:8443');
            console.log('   2. Aceite o aviso de segurança');
            console.log('   3. Execute no console: metaAdsApp.api.setMode("real")');
            console.log('   4. Clique em "Conectar API Real"');
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor HTTPS:', error);
        console.log('💡 Tentando servidor HTTP simples...');
        
        // Fallback para HTTP
        const http = require('http');
        const server = http.createServer(serveFile);
        server.listen(8000, () => {
            console.log('⚠️  Servidor HTTP rodando em: http://localhost:8000');
            console.log('❌ ATENÇÃO: Facebook API requer HTTPS - apenas modo demo funcionará');
        });
    }
};

startServer();