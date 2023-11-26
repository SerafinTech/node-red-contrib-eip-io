module.exports = function(RED) {

    function OutNode(n) {
        RED.nodes.createNode(this, n)
         
        this.conn = RED.nodes.getNode(n.conn).conn;
        let node = this;
        let statusInterval = null
        let convert = (nv) => {
            if (typeof nv === "boolean") {
                if (nv) {
                    nv = 1;
                } else {
                    nv = 0;
                }
            }
            nv = parseInt(nv);
            let binaryString = "";
            for(let i = 0; i < node.conn.outputData.length; i++) {
                binaryString = ("00000000"+ node.conn.outputData[i].toString(2)).slice(-8) + binaryString
            }
            
            nvString = ("0".repeat(n.bitSize)+ nv.toString(2)).slice(-(n.bitSize))

            binaryString = binaryString.substring(0, binaryString.length - n.bitSize - (8 * n.byteOffset) - n.bitOffset) + nvString.toString() + binaryString.substring(binaryString.length - (8 * n.byteOffset) - n.bitOffset, binaryString.length);
            
            for (let j = 0; j < node.conn.outputData.length; j++) {
                node.conn.outputData[j] = parseInt(binaryString.substring(binaryString.length-((j+1)*8),binaryString.length-(j*8)),2)
            }
            
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };
            convert(msg.payload);
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
        }, 10)
        
        this.on('close', () => {
            clearInterval(statusInterval)
        })
    };

    
   
    RED.nodes.registerType("eip-io out", OutNode);

};