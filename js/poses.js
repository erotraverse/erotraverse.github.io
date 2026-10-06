// Силуэты поз для часов EROTRAVERSE (общие для часов и страницы проверки).
// Каждая фигура задаётся «скелетом»: положение бёдер и углы частей тела (0° — вправо, 90° — вниз).
// По скелету строятся гладкие формы: туловище с талией, руки и ноги с сужением, голова, у женщины — грудь, ягодицы и волосы.
var NS = "http://www.w3.org/2000/svg";
function el(name, attrs, parent) {
  var e = document.createElementNS(NS, name);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

var LEN = { torso: 24, head: 6, upper: 12, fore: 11, thigh: 17, shin: 16, foot: 6 };
var BODY = {
  m: { head: 4.6, neck: 2.2, chest: 5.4, waist: 4.3, hip: 4.9, arm: [2.3, 1.8, 1.4], hand: 1.6, leg: [3.8, 2.6, 1.5], foot: [1.4, 1.0] },
  w: { head: 4.6, neck: 2.0, chest: 4.8, waist: 3.2, hip: 6.4, arm: [2.3, 1.8, 1.4], hand: 1.6, leg: [5.0, 3.0, 1.6], foot: [1.4, 1.0] }
};

function dir(a) { var r = a * Math.PI / 180; return [Math.cos(r), Math.sin(r)]; }
function add(p, d, k) { return [p[0] + d[0] * k, p[1] + d[1] * k]; }

// Части одной фигуры: список капсул и кругов
function personParts(s) {
  var B = BODY[s.sex], parts = [], top = [];
  var hip = s.hip, td = dir(s.torso);
  var neck = add(hip, td, LEN.torso);
  var shoulder = add(neck, td, -2.5), chest = add(neck, td, -5), waist = add(neck, td, -14);
  var front = s.front ? (s.front > 0 ? [-td[1], td[0]] : [td[1], -td[0]]) : null;
  var head = add(neck, dir(s.head), LEN.head);
  function cap(a, ra, b, rb, list) { (list || parts).push({ a: a, ra: ra, b: b, rb: rb }); }
  function circ(c, r, list) { (list || parts).push({ a: c, ra: r, b: c, rb: r }); }
  function limb(start, angles, lens, radii, list) {
    var p = start;
    for (var i = 0; i < angles.length; i++) {
      var q = add(p, dir(angles[i]), lens[i]);
      cap(p, radii[i], q, radii[i + 1], list);
      p = q;
    }
    return p;
  }
  // дальние рука и нога — первыми (сливаются с телом, это силуэт)
  if (s.legF) limb(hip, s.legF, [LEN.thigh, LEN.shin, LEN.foot], [B.leg[0], B.leg[1], B.foot[0], B.foot[1]]);
  if (s.armF) { var hf = limb(shoulder, s.armF, [LEN.upper, LEN.fore], B.arm); circ(hf, B.hand); }
  // туловище
  cap(neck, B.neck, chest, B.chest); cap(chest, B.chest, waist, B.waist); cap(waist, B.waist, hip, B.hip);
  if (s.sex === "w" && front) {
    circ(add(add(neck, td, -8), front, 3.6), 3.9);           // грудь
    circ(add(add(hip, front, -3.0), td, -1.2), 6.0);          // ягодицы
  }
  // голова и волосы
  cap(neck, B.neck, head, B.neck);
  circ(head, B.head);
  if (s.sex === "w") {
    if (s.hair != null) cap(head, 4.0, add(head, dir(s.hair), 12), 1.6);
    else circ(add(head, dir(s.head + 180), 3.6), 2.6);         // пучок
  }
  // ближние нога и рука
  if (s.legN) limb(hip, s.legN, [LEN.thigh, LEN.shin, LEN.foot], [B.leg[0], B.leg[1], B.foot[0], B.foot[1]]);
  if (s.armN) { var hn = limb(shoulder, s.armN, [LEN.upper, LEN.fore], B.arm, s.armOnTop ? top : parts); circ(hn, B.hand, s.armOnTop ? top : parts); }
  return { base: parts, top: top };
}

// Капсула = два круга + касательные между ними
function capsulePath(c) {
  var a = c.a, b = c.b, ra = c.ra, rb = c.rb;
  var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
  function circle(p, r) { return "M" + (p[0] - r) + "," + p[1] + "a" + r + "," + r + " 0 1,0 " + 2 * r + ",0a" + r + "," + r + " 0 1,0 " + (-2 * r) + ",0Z"; }
  if (d <= Math.abs(ra - rb) + 0.01) return circle(ra >= rb ? a : b, Math.max(ra, rb));
  var th = Math.atan2(dy, dx), al = Math.acos((ra - rb) / d);
  var p1 = [a[0] + ra * Math.cos(th + al), a[1] + ra * Math.sin(th + al)];
  var p2 = [b[0] + rb * Math.cos(th + al), b[1] + rb * Math.sin(th + al)];
  var p3 = [b[0] + rb * Math.cos(th - al), b[1] + rb * Math.sin(th - al)];
  var p4 = [a[0] + ra * Math.cos(th - al), a[1] + ra * Math.sin(th - al)];
  return "M" + p1 + "L" + p2 + "L" + p3 + "L" + p4 + "Z" + circle(a, ra) + circle(b, rb);
}

function drawParts(list, g, ink, halo, gap) {
  var hp = "", ip = "";
  list.forEach(function (c) {
    hp += capsulePath({ a: c.a, ra: c.ra + gap, b: c.b, rb: c.rb + gap });
    ip += capsulePath(c);
  });
  if (gap > 0) el("path", { d: hp, fill: halo }, g);
  el("path", { d: ip, fill: ink }, g);
}

// Рисует позу в группу g. ink — цвет фигур.
// Просвет вокруг женщины делается маской (прозрачным), а не краской — так сквозь него виден любой фон.
var _maskId = 0;
function drawPose(p, g, ink) {
  var built = p.people.map(personParts);
  var back = el("g", {}, g);                 // всё, что позади текущей фигуры
  if (p.block) el("rect", { x: p.block[0], y: p.block[1], width: p.block[2], height: p.block[3], rx: 1.5, fill: "none", stroke: ink, "stroke-width": 1.6 }, back);
  drawParts(built[0].base, back, ink, null, 0);
  for (var i = 1; i < built.length; i++) {
    // в том, что позади, вырезаем прозрачную щель по контуру следующей фигуры
    var id = "poseGap" + (++_maskId);
    var m = el("mask", { id: id, maskUnits: "userSpaceOnUse", x: -20, y: -20, width: 140, height: 110 }, g);
    el("rect", { x: -20, y: -20, width: 140, height: 110, fill: "#fff" }, m);
    var gp = "";
    built[i].base.forEach(function (c) { gp += capsulePath({ a: c.a, ra: c.ra + 1.5, b: c.b, rb: c.rb + 1.5 }); });
    el("path", { d: gp, fill: "#000" }, m);
    var masked = el("g", { mask: "url(#" + id + ")" }, g);
    masked.appendChild(back);
    var front = el("g", {}, g);
    drawParts(built[i].base, front, ink, null, 0);
    back = el("g", {}, g);
    back.appendChild(masked); back.appendChild(front);
  }
}

// 12 поз из гайда. Рамка 100×70, пол — y = 66.
var POSES = [
  { name: "HIGH BACK", people: [
    { sex: "m", hip: [71, 49], torso: -95, head: -100, front: -1, armN: [120, 160], armF: [115, 150], legN: [92, 0, 0], legF: [95, 2, 0] },
    { sex: "w", hip: [58, 49], torso: 168, head: 200, front: -1, hair: 100, armN: [95, 90], armF: [100, 92], legN: [90, 0, 0], legF: [93, 3, 0] } ] },
  { name: "LOW BACK", people: [
    { sex: "m", hip: [71, 49], torso: -125, head: -135, front: -1, armN: [110, 130], armF: [105, 125], legN: [92, 0, 0], legF: [95, 2, 0] },
    { sex: "w", hip: [58, 49], torso: 153, head: 170, front: -1, hair: 140, armN: [144, 180], armF: [140, 178], legN: [90, 0, 0], legF: [93, 2, 0] } ] },
  { name: "TRAPEZE", people: [
    { sex: "m", hip: [44, 58], torso: -92, head: -95, front: 1, armF: [55, 5], legN: [0, 3, -80], legF: [2, 4, -80], armN: [60, 10] },
    { sex: "w", hip: [52, 50], torso: 20, head: 30, front: -1, hair: 60, armN: [40, 10], armF: [35, 5], legN: [190, 185, 180], legF: [200, 195, 190] } ] },
  { name: "BEND", people: [
    { sex: "m", hip: [67, 49], torso: -92, head: -95, front: -1, armN: [130, -10], armF: [125, -15], legN: [92, 0, 0], legF: [95, 2, 0] },
    { sex: "w", hip: [52, 60], torso: 180, head: 180, front: 1, hair: 170, armN: [175, 180], armF: [185, 182], legN: [-60, -40, -40], legF: [-55, -35, -35] } ] },
  { name: "KNEES", people: [
    { sex: "m", hip: [48, 49], torso: -92, head: -100, front: -1, armF: [110, 160], legN: [92, 0, 0], legF: [95, 2, 0], armN: [120, 170] },
    { sex: "w", hip: [34, 49], torso: -90, head: -95, front: -1, hair: 100, armN: [100, 75], armF: [95, 90], legN: [92, 0, 0], legF: [95, 2, 0] } ] },
  { name: "SPRING", people: [
    { sex: "m", hip: [50, 60], torso: 0, head: 0, front: -1, armN: [5, 0], armF: [8, 2], legN: [180, 180, 180], legF: [178, 180, 180] },
    { sex: "w", hip: [52, 52], torso: -110, head: -100, front: 1, hair: 150, armN: [120, 110], armF: [125, 112], legN: [45, 180, 180], legF: [40, 178, 180] } ] },
  { name: "SPIDER", people: [
    { sex: "m", hip: [66, 60], torso: -55, head: -70, front: -1, armN: [65, 80], armF: [70, 85], legN: [190, 175, 180], legF: [192, 178, 180] },
    { sex: "w", hip: [36, 60], torso: -125, head: -110, front: 1, hair: 130, armN: [115, 100], armF: [110, 95], legN: [-20, 30, 10], legF: [-15, 35, 10] } ] },
  { name: "HILL", people: [
    { sex: "m", hip: [68, 49], torso: -90, head: -95, front: -1, armN: [120, 170], armF: [115, 165], legN: [92, 0, 0], legF: [95, 2, 0] },
    { sex: "w", hip: [56, 46], torso: 149, head: 170, front: 1, hair: 175, armN: [160, 170], armF: [165, 175], legN: [-20, 60, 60], legF: [-15, 55, 55] } ] },
  { name: "SLAT", people: [
    { sex: "m", hip: [66, 49], torso: -90, head: -95, front: -1, armN: [125, 150], armF: [120, 145], legN: [92, 0, 0], legF: [95, 2, 0] },
    { sex: "w", hip: [55, 44], torso: 165, head: 150, front: 1, hair: 100, armN: [135, 125], armF: [130, 120], legN: [-10, 70, 0], legF: [-5, 75, 0] } ] },
  { name: "FROG", people: [
    { sex: "m", hip: [46, 60], torso: 0, head: 0, front: -1, armN: [5, 0], armF: [8, 2], legN: [180, 180, 180], legF: [178, 180, 180] },
    { sex: "w", hip: [50, 51], torso: -95, head: -95, front: -1, hair: 80, armN: [140, 100], armF: [135, 98], legN: [-165, 75, 180], legF: [-160, 78, 180] } ] },
  { name: "SLOPE", block: [0, 40, 14, 26], people: [
    { sex: "m", hip: [58, 34], torso: -92, head: -95, front: -1, armN: [135, 110], armF: [130, 105], legN: [95, 90, 0], legF: [85, 92, 0] },
    { sex: "w", hip: [46, 34], torso: 180, head: 190, front: -1, hair: 100, armN: [145, 100], armF: [140, 98], legN: [95, 90, 180], legF: [88, 92, 180] } ] },
  { name: "LEG UP", block: [2, 45, 56, 21], people: [
    { sex: "m", hip: [66, 33], torso: -92, head: -97, front: -1, armN: [110, 80], armF: [105, 75], legN: [95, 92, 0], legF: [88, 92, 0] },
    { sex: "w", hip: [55, 40], torso: 180, head: 185, front: 1, hair: 170, armN: [175, 180], armF: [178, 182], legN: [-65, -75, -20], legF: [-120, 75, 0] } ] }
];
