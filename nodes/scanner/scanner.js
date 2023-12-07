module.exports = function(RED) {
    function Scanner(n) {
        RED.nodes.createNode(this,n);
        const { IO } = require("st-ethernet-ip");
        this.scanner = new IO.ForkScanner(2222, n.ipaddress);
        
        this.on('close', (done) => {
            setTimeout(() => {
                this.scanner.close(() => {
                    setTimeout(() => {
                        done();
                    }, 5000) 
                })
            }, 250)
        })
    };

    RED.nodes.registerType("eip-io scanner", Scanner);
}