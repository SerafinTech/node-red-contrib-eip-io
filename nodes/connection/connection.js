const { off } = require("process");

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
            let bitOffset = 0;
            let bitString = null;
            n.configdata.forEach(data => {
                let dataArray = JSON.parse(data.value)
                if (Array.isArray(dataArray)) {
                    for (let i = 0; i < parseInt(data.size); i++) {
                        buf[offset] = (dataArray[i]) ? dataArray[i] : 0;
                        offset++;
                    }
                } else {
                    let size = Number(data.size);
                    let multi = Math.pow(10, Number(data.decimals));
                    let value = Number(data.value);
                    let type = Number(data.type);
                    console.log(data.type)
                    if(size < 8) {
                        if (bitString === null) bitString = 0;
                        bitString = ((value * multi) << bitOffset) | bitString;
                        bitOffset += size;

                        if (bitOffset === 8) {
                            buf.writeUInt8(bitString, offset)
                            bitOffset = 0;
                            bitString = null;
                            offset++
                        }
                        if (bitOffset === 16) {
                            buf.writeUInt16LE(bitString, offset)
                            bitOffset = 0;
                            bitString = null;
                            offset += 2
                        }
                        if (bitOffset === 32) {
                            buf.writeUInt32LE(bitString, offset)
                            bitOffset = 0;
                            bitString = null;
                            offset += 4
                        }    
                    }
                    if (size === 8) {
                        if(type === 194) {
                            buf.writeInt8(value * multi, offset);
                        } else {
                            buf.writeUInt8(value * multi, offset);
                        }
                        offset ++;
                    }
                    if (size === 16) {
                        if(type === 195) {
                            buf.writeInt16LE(value * multi, offset);
                        } else {
                            buf.writeUint16LE(value * multi, offset);
                        }
                        offset += 2;
                    }
                    if (size === 32) {
                        if(type === 196) {
                            buf.writeInt32LE(value * multi, offset);
                        } else {
                            buf.writeUint32LE(value * multi, offset);
                        }
                        offset += 4;
                    }
                }
            })

            config.configInstance.data = buf;
            console.log(config.configInstance.data)
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