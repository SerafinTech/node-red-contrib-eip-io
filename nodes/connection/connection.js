module.exports = function(RED) {
    function Connection(n) {
        RED.nodes.createNode(this,n);
        let config = {
            configInstance: {
              assembly: parseInt(n.cfgAss),
              size: parseInt(n.cfgSize)
            },
            inputInstance: {
              assembly: parseInt(n.inputAss),
              size: parseInt(n.inputSize)
            },
            outputInstance: {
                assembly: parseInt(n.outputAss),
                size: parseInt(n.outputSize)
            }
        };

        this.scanner = RED.nodes.getNode(n.scanner).scanner;
        this.conn = this.scanner.addConnection(config, parseInt(n.rpi), n.address);

        this.on('close', (done) => {
            this.conn.run = false;
            this.conn = null;
            done();
        });
    };

    RED.nodes.registerType("eip-io connection", Connection);
};