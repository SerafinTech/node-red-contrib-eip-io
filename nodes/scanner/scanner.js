module.exports = function(RED) {
    function Scanner(n) {
        RED.nodes.createNode(this,n);
        const { IO } = require("st-ethernet-ip");
        this.scanner = new IO.Scanner(parseInt(n.port));
        
        this.on('close', (done) => {
            this.scanner.connections = [];
            this.scanner.socket.close(setTimeout(() => {
                this.scanner = null;
                done();
            },5000))
        })
    };

    RED.nodes.registerType("eip-io scanner", Scanner);
}