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

        // Parse Config Data
        if (Array.isArray(n.configdata)) {
            let buf = Buffer.alloc(config.configInstance.size);
            let offset = 0;
            n.configdata.forEach(data => {
                let dataArray = JSON.parse(data.value)
                if (Array.isArray(dataArray)) {
                    for (let i = 0; i < parseInt(data.size); i++) {
                        buf[offset] = (dataArray[i]) ? dataArray[i] : 0;
                        offset++;
                    }
                } else {
                    switch (parseInt(data.size)) {
                        case 1:
                            buf.writeUInt8(parseInt(data.value), offset);
                            offset++;
                            break;
                        case 2:
                            buf.writeUInt16LE(parseInt(data.value), offset);
                            offset+= 2;
                            break;
                        case 4:
                            buf.writeUInt32LE(parseInt(data.value), offset);
                            offset+= 4;
                            break;
                    }
                }
            })
            config.configInstance.data = buf;
        }

        this.scanner = RED.nodes.getNode(n.scanner).scanner;
        this.conn = this.scanner.addConnection(config, parseInt(n.rpi), n.ipaddress);

        this.on('close', (done) => {
            this.conn.close();
            done();
           
        });
    };

    RED.nodes.registerType("eip-io connection", Connection);
};