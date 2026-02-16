const net = require('net');

const host = 'smtp-relay.brevo.com';
const port = 587;

const client = new net.Socket();
client.connect(port, host, () => {
    console.log('Connected');
    // Wait for greeting
});

let phase = 'greeting';

client.on('data', (data) => {
    const response = data.toString();
    console.log('S: ' + response);

    if (phase === 'greeting' && response.includes('220')) {
        console.log('C: EHLO client.example.com');
        client.write('EHLO client.example.com\r\n');
        phase = 'ehlo';
    } else if (phase === 'ehlo' && response.includes('250-STARTTLS')) {
        // We received capabilities including STARTTLS.
        // wait until the end of capabilities (usually starts with 250)
        // But since packet might be split, let's just send STARTTLS if we see it.
        // Ideally we wait for final 250 line (space after 250).
        // For simplicity, let's assume this block has STARTTLS and send it.
        console.log('C: STARTTLS');
        client.write('STARTTLS\r\n');
        phase = 'starttls';
    } else if (phase === 'starttls' && response.includes('220')) {
        console.log('Server is ready for TLS negotiation. STARTTLS works!');
        client.end();
    }
});

client.on('error', (err) => {
    console.error('Error:', err);
});

client.on('close', () => {
    console.log('Connection closed');
});
