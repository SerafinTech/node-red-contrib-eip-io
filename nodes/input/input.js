module.exports = function(RED) {

    function InNode(n) {
        RED.nodes.createNode(this, n)
         
        this.conn = RED.nodes.getNode(n.conn).conn;
        let node = this;
        let cv = null;
        let statusInterval = null;
        let updateInterval = null;
        let convert = () => {
            
            let binaryString = "";
            for(let i = n.byteOffset; i < node.conn.inputData.length; i++) {
                binaryString = ("00000000"+ node.conn.inputData[i].toString(2)).slice(-8) + binaryString
            }
            
            binaryString = binaryString.slice(binaryString.length - n.bitSize - n.bitOffset, binaryString.length - n.bitOffset)

            return parseInt(binaryString,2)
        }

        let convert2 = () => {
            let result = Buffer.alloc(Math.ceil(n.bitSize / 8))
            node.conn.inputData.copy(result, 0, n.byteOffset, n.byteOffset + Math.ceil(n.bitSize / 8));
            
            switch (n.dataType) {
                case 'UInt8':
                    result = result.readUInt8(0);
                break;
                case 'Int8':
                    result = result.readInt8(0);
                break;
                case 'UInt16':
                    result = (n.bigEndian) ? result.readUInt16BE(0) >> (16 - n.bitSize) : result.readUInt16LE(0);            
                break;
                case 'Int16':
                    result = (n.bigEndian) ? result.readInt16BE(0) >> (16 - n.bitSize) : result.readInt16LE(0);             
                break;
                case 'UInt32':
                    result = (n.bigEndian) ? result.readUInt32BE(0) : result.readUInt32LE(0);               
                break;
                case 'Int32':
                    result = (n.bigEndian) ? result.readInt32BE(0) : result.readInt32LE(0);               
                break;
                case 'Float':
                    result = (n.bigEndian) ? result.readFloatBE(0) : result.readFloatLE(0);
                break;
                case 'Bit':
                    let l = result.length;
                    switch (l) {
                        case 1: result = !!((0x01 << n.bitOffset) & result.readUInt8(0));
                        break;
                        case 2: result = !!((0x01 << n.bitOffset) & result.readUInt16LE(0));
                        break;
                        case 4: result = !!((0x01 << n.bitOffset) & result.readUInt32LE(0));
                        break;
                    }
                    
                break;
            }

            if (n.decimals > 0) {
                result = result / (Math.pow(10, n.decimals));
            }
            return result;
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };
            try {
                msg.payload = convert2();
            } catch {
                msg.payload = 'Conversion Error!'
            }
            
            send(msg);
            if (done) {
                done();
            }
        });

        if(n.updateRate > 0) {
            updateInterval = setInterval(() => {
                let nv;
                try {
                    nv = convert2();
                } catch(e) {
                    nv = 'Conversion Error! ' + e
                }

                if (Buffer.isBuffer(nv)) {
                    if (!cv) cv = Buffer.alloc(nv.length);
                    if (Buffer.compare(cv,nv) !== 0) {
                        nv.copy(cv);
                        let msg = {payload: cv};
                        node.send(msg)
                    };
                } else {
                    if (nv !== cv) {
                        cv = nv;
                        let msg = {payload: cv};
                        node.send(msg)
                    };
                }
                      
            }, n.updateRate)
        }

        statusInterval = setInterval(() => {
            if (node.conn.connected) {
                node.status({fill:"green",shape:"dot",text:"connected"});
            } else {
                node.status({fill:"red",shape:"ring",text:"disconnected"});
            }
        }, 10)

        this.on('close', () => {
            clearInterval(statusInterval)
            clearInterval(updateInterval)
        })     
    };

    RED.nodes.registerType("eip-io in", InNode);
}