const dagre = require('dagre');
const g = new dagre.graphlib.Graph().setGraph({});
try {
  dagre.layout(g);
  console.log("Empty graph OK");
} catch(e) {
  console.log("Empty graph CRASH:", e.message);
}
