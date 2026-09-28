/* Five drawings. The engine gets nothing it did not ask for. */
const SOLIDX="sbd";
const TILEMETA={
  s:{lift:13,kind:"wall"},
  b:{lift:6,kind:"furniture",box:true},
  d:{lift:5,kind:"furniture",box:true},
  g:{lift:0,kind:"water"}      /* a patch of grass. There is no kind:"flat" — docs/TAGS.md L13 */
};
const P=(c)=>function(x,y){ctx.fillStyle=c;ctx.fillRect(x,y,40,40);};
const TILEART={
  s:{top:P("#6E7078"),side:P("#5A5C63")},
  b:{top:P("#8A6A44"),side:P("#75593A")},
  d:{top:P("#7A6248"),side:P("#66513C")},
  g:{top:P("#4E7A52")}
};
