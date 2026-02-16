const tls = require('tls');

const options = {
    host: 'smtp-relay.brevo.com',
    port: 465,
    rejectUnauthorized: false
};

console.log(`Connecting to ${options.host}:${options.port}...`);

const socket = tls.connect(options, () => {
    console.log('Connected via TLS!');
    console.log('Authorized:', socket.authorized);

    if (!socket.authorized) {
        console.log('Authorization Error:', socket.authorizationError);
    }

    // Wait for greeting
});

socket.on('data', (data) => {
    console.log('Received: ' + data);
    socket.end();
});

socket.on('error', (err) => {
    console.error('Connection error:', err);
});

socket.on('close', () => {
    console.log('Connection closed');
});
