module.exports = function(RED) {
    function Connection(n) {
        RED.nodes.createNode(this,n);
        let config = {
            configInstance: {
              assembly: parseInt(n.assconfig),
              size: parseInt(n.sizeconfig)
            },
            inputInstance: {
              assembly: parseInt(n.assinput),
              size: parseInt(n.sizeinput)
            },
            outputInstance: {
                assembly: parseInt(n.assoutput),
                size: parseInt(n.sizeoutput)
            }
        };

        this.scanner = RED.nodes.getNode(n.scanner).scanner;
        this.conn = this.scanner.addConnection(config, parseInt(n.rpi), n.ipaddress);

        this.on('close', (done) => {
            this.conn.run = false;
            this.conn = null;
            done();
        });
    };

    RED.nodes.registerType("eip-io connection", Connection);
};