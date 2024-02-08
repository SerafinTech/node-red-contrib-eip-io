function updateBit(number, bitPosition, bitValue) {
    const bitValueNormalized = bitValue ? 1 : 0;
    const clearMask = ~(1 << bitPosition);
    return (number & clearMask) | (bitValueNormalized << bitPosition);
}

module.exports = function(RED) {

    function OutNode(n) {
        RED.nodes.createNode(this, n)
         
        this.conn = RED.nodes.getNode(n.conn).conn;
        let node = this;
        let statusInterval = null
        let convert2 = (nv) => {
            let outValue = nv * (Math.pow(10, n.decimals));
            let byteOffset = parseInt(n.byteOffset);
            let bitOffset = parseInt(n.bitOffset)
            
            switch (n.dataType) {
                case 'UInt8':
                    node.conn.outputData.writeUInt8(parseInt(outValue), byteOffset)
                break;
                case 'Int8':
                    node.conn.outputData.writeInt8(parseInt(outValue), byteOffset)
                break;
                case 'UInt16': 
                    if (n.bigEndian) {
                        node.conn.outputData.writeUInt16BE(parseInt(outValue), byteOffset)
                    } else {
                        node.conn.outputData.writeUInt16LE(parseInt(outValue), byteOffset)
                    }             
                break;
                case 'Int16':
                    if (n.bigEndian) {
                        node.conn.outputData.writeInt16BE(parseInt(outValue), byteOffset)
                    } else {
                        node.conn.outputData.writeInt16LE(parseInt(outValue), byteOffset)
                    }            
                break;
                case 'UInt32':
                    if (n.bigEndian) {
                        node.conn.outputData.writeUInt32BE(parseInt(outValue), byteOffset)
                    } else {
                        node.conn.outputData.writeUInt32LE(parseInt(outValue), byteOffset)
                    }              
                break;
                case 'Int32':
                    if (n.bigEndian) {
                        node.conn.outputData.writeInt32BE(parseInt(outValue), byteOffset)
                    } else {
                        node.conn.outputData.writeInt32LE(parseInt(outValue), byteOffset)
                    }               
                break;
                case 'Float':
                    if (n.bigEndian) {
                        node.conn.outputData.writeFloatBE(outValue, byteOffset)
                    } else {
                        node.conn.outputData.writeFloatLE(outValue, byteOffset)
                    }
                break;
                case 'Bit':
                    if (n.bitOffset < 8) {
                        node.conn.outputData.writeUInt8(updateBit(node.conn.outputData.readUInt8(byteOffset), bitOffset, outValue), byteOffset)
                    } else if (bitOffset < 16) {
                        if (n.bigEndian) {
                            node.conn.outputData.writeUInt16BE(updateBit(node.conn.outputData.readUInt16BE(byteOffset), bitOffset, outValue), byteOffset) 
                        } else {
                            node.conn.outputData.writeUInt16LE(updateBit(node.conn.outputData.readUInt16LE(byteOffset), bitOffset, outValue), byteOffset)
                        }
                    } else if (bitOffset < 32) {
                        if (n.bigEndian) {
                            node.conn.outputData.writeUInt32BE(updateBit(node.conn.outputData.readUInt32BE(byteOffset), bitOffset, outValue), byteOffset) 
                        } else {
                            node.conn.outputData.writeUInt32LE(updateBit(node.conn.outputData.readUInt32LE(byteOffset), bitOffset, outValue), byteOffset)
                        }
                    }
                    
                break;
            }
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };
            try {
                convert2(msg.payload);  
            } catch (e){
                msg.payload = e
            }
            send(msg)
            if (done) {
                done();
            }
        });

        statusInterval = setInterval(() => {
            if (node.conn.connected) {
                node.status({fill:"green",shape:"dot",text:"connected"});
            } else {
                node.status({fill:"red",shape:"ring",text:"disconnected"});
            }
        }, 500)
        
        this.on('close', () => {
            clearInterval(statusInterval)
        })
    };

    
   
    RED.nodes.registerType("eip-io out", OutNode);

};