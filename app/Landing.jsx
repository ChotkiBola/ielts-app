"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const coral = "#FF6A4D";
const orange = "#FF8A3D";
const amber = "#FFA524";
const gold = "#FFA524";
const ink = "#2A211E";
const inkSoft = "#6B5D56";
const cream = "#FFF6ED";
const creamDim = "#FDEEE0";
const paper = "#FFFDFB";
const borderLine = "rgba(42,33,30,0.10)";
const green = "#2E8B57";
const coffee900 = "#1B120C";
const coffee800 = "#2B1B12";
const coffee700 = "#402615";
const serif = "'DM Serif Display', serif";
const sans = "'Plus Jakarta Sans', system-ui, sans-serif";
const easeStr = "cubic-bezier(.16,.84,.44,1)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.lp{font-family:${sans};font-size:16px;line-height:1.5;background:${cream};color:${ink};overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.lp *,.lp *::before,.lp *::after{box-sizing:border-box;margin:0;padding:0;}
.lp img,.lp svg{display:block;max-width:100%;}
.lp button{font:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.lp ul{list-style:none;}
.lp a{color:inherit;text-decoration:none;}
.lp :focus-visible{outline:2px solid ${coral};outline-offset:3px;}

@media(prefers-reduced-motion:reduce){
  .lp *,.lp *::before,.lp *::after{animation-duration:0.001s!important;animation-iteration-count:1!important;transition-duration:0.001s!important;}
}

.lp .lp-con{width:100%;max-width:1180px;margin:0 auto;padding:0 32px;}
@media(max-width:560px){.lp .lp-con{padding:0 20px;}}

.lp .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:#C24A1B;background:${paper};border:1px solid ${borderLine};padding:8px 16px 8px 12px;border-radius:999px;}
.lp .lp-dot{width:7px;height:7px;border-radius:50%;background:${coral};box-shadow:0 0 0 4px rgba(255,106,77,0.22);flex-shrink:0;}

.lp .lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 26px;border-radius:999px;font-weight:700;font-size:15px;white-space:nowrap;transition:transform .35s ${easeStr},box-shadow .35s ${easeStr},background .25s ease,color .25s ease;}
.lp .lp-btn-primary{background:${ink};color:${cream};box-shadow:0 14px 30px -12px rgba(33,22,16,.55);}
.lp .lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 34px -12px rgba(33,22,16,.6);background:#C24A1B;}
.lp .lp-btn-ghost{background:transparent;color:${ink};border:1.5px solid ${borderLine};}
.lp .lp-btn-ghost:hover{border-color:${ink};transform:translateY(-2px);}
.lp .lp-btn-light{background:${cream};color:${ink};}
.lp .lp-btn-light:hover{transform:translateY(-2px);box-shadow:0 14px 30px -12px rgba(0,0,0,.35);}

/* ── NAV ── */
.lp .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px 0;transition:background .3s ease,box-shadow .3s ease,padding .3s ease;}
.lp .lp-nav.scrolled{background:rgba(255,246,237,0.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 1px 0 ${borderLine};padding:12px 0;}
.lp .lp-nav-row{display:flex;align-items:center;justify-content:space-between;gap:24px;}
.lp .lp-brand{display:flex;align-items:center;gap:10px;font-family:${serif};font-weight:600;font-size:20px;letter-spacing:-.01em;cursor:pointer;}
.lp .lp-nav-links{display:flex;align-items:center;gap:32px;font-weight:600;font-size:14.5px;}
.lp .lp-nav-links a{opacity:.75;transition:opacity .2s ease;cursor:pointer;}
.lp .lp-nav-links a:hover{opacity:1;}
.lp .lp-nav-actions{display:flex;align-items:center;gap:14px;}
.lp .lp-lang{display:flex;background:${paper};border:1px solid ${borderLine};border-radius:999px;padding:3px;font-size:12.5px;font-weight:700;}
.lp .lp-lang button{padding:6px 11px;border-radius:999px;color:${inkSoft};transition:background .2s,color .2s;}
.lp .lp-lang button.active{background:${ink};color:${cream};}
@media(max-width:980px){.lp .lp-nav-links{display:none;}}

/* ── HERO ── */
.lp .lp-hero{position:relative;padding:168px 0 120px;overflow:hidden;isolation:isolate;}
@media(max-width:560px){.lp .lp-hero{padding:140px 0 90px;}}
.lp .lp-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;will-change:transform;pointer-events:none;}
.lp .lp-blob-1{width:520px;height:520px;background:radial-gradient(circle,rgba(255,193,160,1),transparent 70%);top:-140px;right:-80px;animation:lpdrift1 26s ease-in-out infinite;}
.lp .lp-blob-2{width:420px;height:420px;background:radial-gradient(circle,#FFE1C2,transparent 70%);bottom:-160px;left:-100px;animation:lpdrift2 32s ease-in-out infinite;}
.lp .lp-blob-3{width:300px;height:300px;background:radial-gradient(circle,${gold},transparent 72%);top:30%;left:38%;opacity:.28;animation:lpdrift1 22s ease-in-out infinite reverse;}
@keyframes lpdrift1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-40px,50px) scale(1.14);}}
@keyframes lpdrift2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(50px,-30px) scale(1.1);}}
.lp .lp-grain{position:absolute;inset:0;z-index:-1;opacity:.05;mix-blend-mode:multiply;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
.lp .lp-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;}
@media(max-width:980px){.lp .lp-hero-grid{grid-template-columns:1fr;}.lp .lp-hero-visual{margin-top:20px;}}
.lp .lp-hero-copy .lp-eyebrow{margin-bottom:26px;}
.lp .lp-hero-h1{font-family:${serif};font-weight:600;font-size:clamp(40px,5.2vw,68px);line-height:1.04;letter-spacing:-.015em;}
.lp .lp-hero-h1 em{font-style:italic;color:${coral};font-weight:500;}
.lp .lp-lede{margin-top:26px;font-size:18px;line-height:1.65;color:${inkSoft};max-width:520px;}
.lp .lp-hero-actions{display:flex;align-items:center;gap:16px;margin-top:38px;flex-wrap:wrap;}
@media(max-width:560px){.lp .lp-hero-actions .lp-btn{width:100%;}}
.lp .lp-hero-trust{display:flex;align-items:center;gap:14px;margin-top:44px;font-size:13.5px;color:${inkSoft};font-weight:600;flex-wrap:wrap;}

.lp .lp-hero-visual{position:relative;perspective:1200px;}
.lp .lp-grade-card{background:${paper};border-radius:28px;border:1px solid ${borderLine};box-shadow:0 30px 60px -25px rgba(43,27,18,0.35);padding:26px;width:100%;max-width:420px;margin-left:auto;transform:rotate(2.2deg);transition:transform .5s ${easeStr};}
@media(max-width:980px){.lp .lp-grade-card{margin:0 auto;transform:none;}}
.lp .lp-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.lp .lp-grade-tag{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${inkSoft};}
.lp .lp-grade-live{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:${green};}
.lp .lp-grade-live i{width:7px;height:7px;border-radius:50%;background:${green};animation:lppulse 1.6s ease-in-out infinite;flex-shrink:0;}
@keyframes lppulse{0%,100%{opacity:1;}50%{opacity:.35;}}
.lp .lp-essay-box{background:${creamDim};border-radius:14px;padding:16px 18px;min-height:118px;font-size:14.5px;line-height:1.7;}
.lp .lp-essay-mark{background:rgba(255,106,77,0.18);color:#C24A1B;border-radius:4px;padding:0 3px;font-weight:600;}
.lp .lp-cursor{display:inline-block;width:2px;height:15px;background:${coral};vertical-align:middle;animation:lpblink 1s step-end infinite;margin-left:1px;}
@keyframes lpblink{50%{opacity:0;}}
.lp .lp-score-row{display:flex;align-items:center;gap:16px;margin-top:20px;}
.lp .lp-score-badge{font-family:${serif};font-weight:600;font-size:46px;color:${coral};line-height:1;}
.lp .lp-score-meta{font-size:12.5px;color:${inkSoft};font-weight:600;line-height:1.4;}
.lp .lp-criteria{margin-top:18px;display:flex;flex-direction:column;gap:10px;}
.lp .lp-criteria-row{font-size:12.5px;font-weight:600;color:${inkSoft};}
.lp .lp-criteria-label{display:flex;justify-content:space-between;margin-bottom:5px;}
.lp .lp-bar-track{height:6px;border-radius:4px;background:rgba(33,22,16,.08);overflow:hidden;}
.lp .lp-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,${gold},${coral});width:0%;}

.lp .lp-float-chip{position:absolute;background:${paper};border:1px solid ${borderLine};border-radius:999px;padding:9px 15px;font-size:12.5px;font-weight:700;box-shadow:0 20px 40px -20px rgba(43,27,18,0.3);display:flex;align-items:center;gap:8px;}
.lp .lp-chip-1{top:-18px;left:-30px;animation:lpfloaty 5s ease-in-out infinite;}
.lp .lp-chip-2{bottom:6%;right:-8%;animation:lpfloaty 6s ease-in-out infinite 1s;}
@keyframes lpfloaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
.lp .lp-chip-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.lp .lp-scroll-cue{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${inkSoft};opacity:.7;}
.lp .lp-scline{width:1px;height:34px;background:linear-gradient(${inkSoft},transparent);animation:lpscdown 1.8s ease-in-out infinite;}
@keyframes lpscdown{0%{transform:scaleY(0);transform-origin:top;}50%{transform:scaleY(1);transform-origin:top;}51%{transform-origin:bottom;}100%{transform:scaleY(0);transform-origin:bottom;}}

/* ── METAMORPHOSIS ── */
.lp .lp-meta{position:relative;padding:40px 0 110px;}
.lp .lp-meta-row{display:flex;align-items:center;justify-content:center;gap:44px;}
@media(max-width:700px){.lp .lp-meta-row{flex-direction:column;gap:26px;}.lp .lp-meta-copy{text-align:center;}}
.lp .lp-meta-icon{position:relative;width:104px;height:104px;flex-shrink:0;transform-origin:center;}
.lp .lp-meta-icon svg{position:absolute;inset:0;width:100%;height:100%;}
.lp .lp-meta-cocoon{stroke:${inkSoft};opacity:1;}
.lp .lp-meta-butterfly{stroke:${coral};opacity:0;transform:translateY(10px) scale(.82);transform-origin:center;}
.lp .lp-wing{transform-origin:12px 12px;animation:lpflutter 2.6s ease-in-out infinite;}
.lp .lp-wing-r{animation-delay:.15s;}
@keyframes lpflutter{0%,100%{transform:rotateY(0deg) scaleX(1);}50%{transform:rotateY(35deg) scaleX(.86);}}
.lp .lp-meta-copy{max-width:420px;}
.lp .lp-meta-copy .lp-eyebrow{margin-bottom:16px;}
.lp .lp-meta-h2{font-family:${serif};font-weight:600;font-size:clamp(24px,2.6vw,32px);line-height:1.2;letter-spacing:-.01em;}
.lp .lp-meta-h2 em{font-style:italic;color:${coral};font-weight:500;}
.lp .lp-meta-copy p{margin-top:14px;font-size:15px;color:${inkSoft};line-height:1.65;}
.lp .lp-meta-track{max-width:640px;margin:0 auto;}

/* ── STATS ── */
.lp .lp-stats{padding:0 0 100px;position:relative;z-index:1;}
.lp .lp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
@media(max-width:980px){.lp .lp-stats-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.lp .lp-stats-grid{grid-template-columns:1fr;}}
.lp .lp-stat-card{background:${paper};border:1px solid ${borderLine};border-radius:18px;padding:30px 26px;}
.lp .lp-stat-num{font-family:${serif};font-weight:600;font-size:40px;color:${coral};letter-spacing:-.02em;}
.lp .lp-stat-label{margin-top:8px;font-size:13.5px;color:${inkSoft};font-weight:600;line-height:1.4;}

/* ── NETWORK ── */
.lp .lp-network{position:relative;overflow:hidden;background:linear-gradient(135deg,${coffee900},${coffee700} 55%,${coffee800});color:#F3E7DA;padding:130px 0;}
.lp .lp-network canvas{position:absolute;inset:0;width:100%;height:100%;opacity:.55;}
.lp .lp-network-inner{position:relative;z-index:2;}
.lp .lp-network-head{max-width:640px;}
.lp .lp-network-head .lp-eyebrow{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:${gold};}
.lp .lp-network-head .lp-dot{background:${gold};box-shadow:0 0 0 4px rgba(255,165,36,0.25);}
.lp .lp-network-h2{font-family:${serif};font-weight:600;font-size:clamp(32px,4vw,48px);line-height:1.12;margin-top:22px;letter-spacing:-.01em;}
.lp .lp-network-h2 em{font-style:italic;color:${gold};font-weight:500;}
.lp .lp-network-head p{margin-top:20px;font-size:17px;line-height:1.7;color:#D8C7B7;max-width:540px;}
.lp .lp-nf-grid{margin-top:56px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
@media(max-width:980px){.lp .lp-nf-grid{grid-template-columns:1fr;}}
.lp .lp-nf-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:26px 24px;backdrop-filter:blur(6px);}
.lp .lp-nf-icon{width:38px;height:38px;border-radius:10px;background:rgba(255,165,36,0.16);display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:${gold};}
.lp .lp-nf-card h3{font-size:16px;font-weight:700;margin-bottom:8px;}
.lp .lp-nf-card p{font-size:14px;color:#C9B8A8;line-height:1.6;}

/* ── SECTION HEAD ── */
.lp .lp-sec-head{max-width:640px;margin:0 auto 60px;text-align:center;}
.lp .lp-sec-head .lp-eyebrow{margin-bottom:22px;}
.lp .lp-sec-head h2{font-family:${serif};font-weight:600;font-size:clamp(30px,3.6vw,44px);letter-spacing:-.01em;line-height:1.12;}
.lp .lp-sec-head h2 em{font-style:italic;color:${coral};font-weight:500;}
.lp .lp-sec-head p{margin-top:18px;font-size:16.5px;color:${inkSoft};line-height:1.65;}

/* ── SKILLS ── */
.lp .lp-skills{padding:130px 0;}
.lp .lp-skills-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
@media(max-width:980px){.lp .lp-skills-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.lp .lp-skills-grid{grid-template-columns:1fr;}}
.lp .lp-skill-card{grid-column:span 2;background:${paper};border:1px solid ${borderLine};border-radius:18px;padding:28px 26px;transition:transform .4s ${easeStr},box-shadow .4s ${easeStr},border-color .4s ease;}
.lp .lp-skill-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px -25px rgba(43,27,18,0.35);border-color:transparent;}
.lp .lp-skill-card.big{grid-column:span 4;display:grid;grid-template-columns:1.1fr .9fr;gap:32px;align-items:center;}
@media(max-width:980px){.lp .lp-skill-card.big{grid-column:span 2;grid-template-columns:1fr;}}
@media(max-width:560px){.lp .lp-skill-card,.lp .lp-skill-card.big{grid-column:span 1;grid-template-columns:1fr;}}
.lp .lp-skill-icon{width:44px;height:44px;border-radius:12px;background:rgba(255,106,77,0.16);color:#C24A1B;display:flex;align-items:center;justify-content:center;margin-bottom:18px;}
.lp .lp-skill-card h3{font-size:18.5px;font-weight:700;margin-bottom:10px;letter-spacing:-.01em;}
.lp .lp-skill-card p{font-size:14.5px;color:${inkSoft};line-height:1.65;}
.lp .lp-skill-tags{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;}
.lp .lp-skill-tags span{font-size:11.5px;font-weight:700;background:${creamDim};color:${inkSoft};padding:5px 10px;border-radius:999px;}
.lp .lp-waveform{display:flex;align-items:flex-end;gap:3px;height:44px;}
.lp .lp-waveform i{flex:1;background:linear-gradient(180deg,${gold},${coral});border-radius:3px;animation:lpwave 1.4s ease-in-out infinite;}
@keyframes lpwave{0%,100%{transform:scaleY(.4);}50%{transform:scaleY(1);}}

/* ── PROCESS ── */
.lp .lp-process{padding:100px 0 130px;}
.lp .lp-process-track{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:20px;}
@media(max-width:980px){.lp .lp-process-track{grid-template-columns:repeat(2,1fr);row-gap:40px;}}
.lp .lp-process-line{position:absolute;top:27px;left:6%;right:6%;height:2px;pointer-events:none;}
@media(max-width:980px){.lp .lp-process-line{display:none;}}
.lp .lp-process-line svg{width:100%;height:2px;overflow:visible;}
.lp .lp-step{position:relative;}
.lp .lp-step-num{width:56px;height:56px;border-radius:50%;background:${paper};border:1.5px solid ${borderLine};display:flex;align-items:center;justify-content:center;font-family:${serif};font-weight:600;font-size:20px;color:${coral};position:relative;z-index:2;}
.lp .lp-step h3{margin-top:22px;font-size:17px;font-weight:700;}
.lp .lp-step p{margin-top:10px;font-size:14px;color:${inkSoft};line-height:1.65;}

/* ── FEEDBACK EXAMPLES ── */
.lp .lp-feedback{padding:0 0 130px;}
.lp .lp-feedback-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
@media(max-width:980px){.lp .lp-feedback-grid{grid-template-columns:1fr;}}
.lp .lp-fb-card{background:${paper};border:1px solid ${borderLine};border-radius:18px;padding:28px 24px;display:flex;flex-direction:column;}
.lp .lp-fb-label{font-size:10.5px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:${inkSoft};margin-bottom:16px;padding:4px 10px;background:${creamDim};border-radius:999px;display:inline-block;align-self:flex-start;}
.lp .lp-fb-card h4{font-size:15px;font-weight:700;margin-bottom:12px;color:${ink};}
.lp .lp-fb-row{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.55;margin-top:8px;}
.lp .lp-fb-icon{flex-shrink:0;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;margin-top:1px;}
.lp .lp-fb-icon.err{background:rgba(255,106,77,0.15);color:#C24A1B;}
.lp .lp-fb-icon.fix{background:rgba(46,139,87,0.15);color:${green};}
.lp .lp-fb-row.note{margin-top:14px;font-size:13px;color:${inkSoft};}
.lp .lp-fb-band-row{display:flex;gap:10px;align-items:center;font-size:12.5px;font-weight:600;margin-top:8px;}
.lp .lp-fb-band-pill{font-family:${serif};font-size:20px;font-weight:600;color:${coral};min-width:36px;text-align:right;flex-shrink:0;}
.lp .lp-fb-bar-track{flex:1;height:6px;border-radius:4px;background:rgba(33,22,16,.08);overflow:hidden;}
.lp .lp-fb-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,${gold},${coral});}

/* ── FINAL CTA ── */
.lp .lp-final{position:relative;margin:0 32px 32px;border-radius:36px;overflow:hidden;background:linear-gradient(135deg,${coffee900},${coffee700});padding:100px 40px;text-align:center;}
@media(max-width:560px){.lp .lp-final{margin:0 16px 16px;padding:70px 24px;border-radius:24px;}}
.lp .lp-final-wm{position:absolute;top:50%;right:-40px;transform:translateY(-50%);width:420px;height:420px;opacity:.07;pointer-events:none;z-index:0;}
.lp .lp-final>*:not(.lp-final-wm){position:relative;z-index:1;}
.lp .lp-final h2{font-family:${serif};font-weight:600;color:#FBEFE2;font-size:clamp(32px,5vw,56px);letter-spacing:-.01em;}
.lp .lp-final h2 em{color:${gold};font-style:italic;font-weight:500;}
.lp .lp-final p{margin-top:18px;color:#D8C7B7;font-size:16px;}
.lp .lp-final small{display:block;margin-top:16px;color:#B8A493;font-size:12.5px;font-weight:600;}

/* ── FOOTER ── */
.lp footer{padding:70px 0 40px;}
.lp .lp-footer-top{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;padding-bottom:50px;border-bottom:1px solid ${borderLine};}
.lp .lp-footer-brand p{margin-top:14px;max-width:280px;font-size:14px;color:${inkSoft};line-height:1.6;}
.lp .lp-footer-cols{display:flex;gap:64px;flex-wrap:wrap;}
.lp .lp-footer-col h4{font-size:12.5px;text-transform:uppercase;letter-spacing:.06em;color:${inkSoft};margin-bottom:16px;}
.lp .lp-footer-col a{display:block;font-size:14.5px;font-weight:600;margin-bottom:12px;opacity:.85;cursor:pointer;}
.lp .lp-footer-col a:hover{opacity:1;color:#C24A1B;}
.lp .lp-footer-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:28px;font-size:13px;color:${inkSoft};flex-wrap:wrap;gap:12px;}
@media(max-width:980px){.lp .lp-footer-top{flex-direction:column;gap:32px;}}

/* ── REVEAL ── */
.lp .lp-reveal{opacity:0;transform:translateY(28px);}
`;

function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect x="6" y="6" width="20" height="20" rx="6" transform="rotate(45 16 16)" fill={coral} />
      <rect x="11" y="11" width="10" height="10" rx="3" transform="rotate(45 16 16)" fill="rgba(255,236,220,0.9)" />
    </svg>
  );
}

function IconBook() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
}
function IconPen() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>;
}
function IconMic() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>;
}
function IconHeadphones() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>;
}
function IconReading() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M9 7h6M9 11h6"/></svg>;
}
function IconCheck() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
}
function IconPronunc() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19v3M8 23h8"/><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/></svg>;
}
function IconTarget() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
function IconBolt() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 11-14h-7z"/></svg>;
}
function IconClock() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>;
}
function IconGlobe() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>;
}

export default function Landing({ lang, onLang, onStart }) {
  const t = (en, uz) => (lang === "uz" ? uz : en);

  const containerRef = useRef(null);
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const gradeCardRef = useRef(null);
  const essayTextRef = useRef(null);
  const scoreBadgeRef = useRef(null);
  const barRefs = useRef([]);
  const metaIconRef = useRef(null);
  const metaCocoonRef = useRef(null);
  const metaButterflyRef = useRef(null);
  const canvasRef = useRef(null);
  const processLineRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // track all cleanup handles
    let rafId = null;
    let resizeHandler = null;
    let navScrollHandler = null;
    let mouseMoveHandler = null;
    let alive = true;
    let typeInterval = null;
    const timeouts = [];

    // ── nav scroll state ──
    const navEl = navRef.current;
    if (navEl) {
      navScrollHandler = () => navEl.classList.toggle("scrolled", window.scrollY > 20);
      window.addEventListener("scroll", navScrollHandler, { passive: true });
      navScrollHandler(); // init
    }

    // ── canvas constellation ──
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx2d = canvas.getContext("2d");
      let nodes = [];
      const sizeCanvas = () => {
        const section = canvas.parentElement;
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
        const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 18000));
        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6,
        }));
      };
      const drawNetwork = () => {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
          if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        }
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 140) {
              ctx2d.strokeStyle = `rgba(255,165,36,${0.16 * (1 - d / 140)})`;
              ctx2d.lineWidth = 1;
              ctx2d.beginPath();
              ctx2d.moveTo(nodes[i].x, nodes[i].y);
              ctx2d.lineTo(nodes[j].x, nodes[j].y);
              ctx2d.stroke();
            }
          }
        }
        for (const n of nodes) {
          ctx2d.beginPath();
          ctx2d.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx2d.fillStyle = "rgba(245,215,170,0.85)";
          ctx2d.fill();
        }
        if (!reduceMotion && alive) rafId = requestAnimationFrame(drawNetwork);
      };
      sizeCanvas();
      drawNetwork();
      resizeHandler = () => { sizeCanvas(); ScrollTrigger.refresh(); };
      window.addEventListener("resize", resizeHandler);
    }

    // ── typewriter ──
    const essayLines = [
      {
        plain: "Many people believe that social media improves communication, while others argue it weakens face-to-face relationships...",
        html: `Many people believe that <span class="lp-essay-mark">social media improves communication</span>, while others argue it weakens face-to-face relationships...`,
      },
      {
        plain: "In my opinion, the benefits outweigh the drawbacks when platforms are used with clear intention...",
        html: `In my opinion, <span class="lp-essay-mark">the benefits outweigh the drawbacks</span> when platforms are used with clear intention...`,
      },
      {
        plain: "To conclude, a balanced approach to technology allows individuals to enjoy connectivity without losing depth...",
        html: `To conclude, <span class="lp-essay-mark">a balanced approach to technology</span> allows individuals to enjoy connectivity without losing depth...`,
      },
    ];
    const barFills = [88, 80, 88, 80];
    const essayEl = essayTextRef.current;
    const badgeEl = scoreBadgeRef.current;
    const barEls = barRefs.current;

    const resetScore = () => {
      if (badgeEl) badgeEl.textContent = "0.0";
      barEls.forEach((b) => b && gsap.set(b, { width: "0%" }));
    };

    const animateScore = () => {
      if (!badgeEl || !alive) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 7.5,
        duration: 1.1,
        ease: "power2.out",
        snap: { val: 0.1 },
        onUpdate() { if (badgeEl && alive) badgeEl.textContent = obj.val.toFixed(1); },
      });
      barEls.forEach((b, i) => b && gsap.to(b, { width: barFills[i] + "%", duration: 1, ease: "power2.out" }));
    };

    const typeLine = (plain, html, cb) => {
      if (!essayEl || !alive) return;
      let i = 0;
      essayEl.textContent = "";
      if (typeInterval) clearInterval(typeInterval);
      typeInterval = setInterval(() => {
        if (!alive) { clearInterval(typeInterval); return; }
        i++;
        essayEl.textContent = plain.slice(0, i);
        if (i >= plain.length) {
          clearInterval(typeInterval);
          typeInterval = null;
          if (alive) { essayEl.innerHTML = html; cb && cb(); }
        }
      }, 22);
    };

    let lineIdx = 0;
    const cycle = () => {
      if (!alive) return;
      resetScore();
      const { plain, html } = essayLines[lineIdx % essayLines.length];
      typeLine(plain, html, () => {
        if (!alive) return;
        const t1 = setTimeout(animateScore, 250);
        timeouts.push(t1);
        const t2 = setTimeout(() => { lineIdx++; cycle(); }, 3600);
        timeouts.push(t2);
      });
    };

    if (reduceMotion) {
      if (essayEl) essayEl.innerHTML = essayLines[0].html;
      if (badgeEl) badgeEl.textContent = "7.5";
      barEls.forEach((b, i) => b && (b.style.width = barFills[i] + "%"));
    } else {
      const t0 = setTimeout(cycle, 900);
      timeouts.push(t0);
    }

    // ── mouse parallax on hero card ──
    const heroEl = heroRef.current;
    const card = gradeCardRef.current;
    if (!reduceMotion && window.matchMedia("(min-width:981px)").matches && heroEl && card) {
      mouseMoveHandler = (e) => {
        const rx = (e.clientY / window.innerHeight - 0.5) * -8;
        const ry = (e.clientX / window.innerWidth - 0.5) * 10;
        gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.6, ease: "power2.out", transformPerspective: 1000 });
      };
      heroEl.addEventListener("mousemove", mouseMoveHandler);
    }

    // ── GSAP scroll animations (scoped to containerRef) ──
    const gCtx = gsap.context(() => {
      if (!reduceMotion) {
        // hero entrance
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".lp-hero-copy .lp-eyebrow", { y: 16, opacity: 0, duration: 0.6 })
          .from(".lp-hero-h1", { y: 26, opacity: 0, duration: 0.8 }, "-=.35")
          .from(".lp-lede", { y: 20, opacity: 0, duration: 0.7 }, "-=.5")
          .from(".lp-hero-actions .lp-btn", { y: 16, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=.45")
          .from(".lp-hero-trust", { y: 14, opacity: 0, duration: 0.6 }, "-=.35")
          .from(".lp-grade-card", { y: 34, opacity: 0, duration: 0.9, ease: "power3.out" }, "-=.9")
          .from(".lp-float-chip", { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.15, ease: "back.out(2)" }, "-=.5");

        // metamorphosis
        const metaIcon = metaIconRef.current;
        const metaCocoon = metaCocoonRef.current;
        const metaButterfly = metaButterflyRef.current;
        if (metaIcon && metaCocoon && metaButterfly) {
          gsap.timeline({
            scrollTrigger: { trigger: metaIcon, start: "top 75%", toggleActions: "restart none none reset" },
          })
            .to(metaIcon, { scale: 1.08, duration: 5.5, ease: "sine.inOut" }, 0)
            .to(metaCocoon, { opacity: 0, duration: 1.8, ease: "power2.inOut" }, 1.2)
            .to(metaButterfly, { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: "power2.inOut" }, 1.2);
        }

        // batch reveal
        ScrollTrigger.batch(".lp-reveal", {
          start: "top 88%",
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", overwrite: true }),
          once: true,
        });

        // process line scrub
        const lineFill = processLineRef.current;
        if (lineFill) {
          gsap.to(lineFill, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: ".lp-process-track", start: "top 70%", end: "bottom 60%", scrub: 1 },
          });
        }
      } else {
        // reduced motion: show end states immediately
        gsap.set(metaCocoonRef.current, { opacity: 0 });
        gsap.set(metaButterflyRef.current, { opacity: 1, y: 0, scale: 1 });
        gsap.set(".lp-reveal", { opacity: 1, y: 0 });
      }
    }, containerRef);

    return () => {
      alive = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (typeInterval) clearInterval(typeInterval);
      timeouts.forEach((id) => clearTimeout(id));
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (navScrollHandler) window.removeEventListener("scroll", navScrollHandler);
      if (mouseMoveHandler && heroEl) heroEl.removeEventListener("mousemove", mouseMoveHandler);
      gCtx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const skillCards = [
    {
      icon: <IconBook />,
      title: t("Vocabulary Builder", "Lug'at tuzuvchi"),
      desc: t(
        "Learn the word families and collocations examiners actually reward, with spaced repetition that adapts to what you forget.",
        "Imtihonchilar mukofotlaydigan so'z oilalari va kolokatsiyalarni o'rganing — esdan chiqaradigan narsangizga moslashadigan interval takrorlash bilan."
      ),
      tags: [t("Collocations", "Kolokatsiyalar"), t("Spaced repetition", "Interval takrorlash")],
      big: false,
    },
    {
      icon: <IconPen />,
      title: t("Writing Mock Exams", "Yozuv sinov imtihonlari"),
      desc: t(
        "Full Task 1 and Task 2 essays, scored against all four band criteria in under a minute — every time you write.",
        "Task 1 va Task 2 to'liq essaylari, bir daqiqada to'rtta band mezoni bo'yicha baholanadi — har safar yozganingizda."
      ),
      tags: ["Task 1", "Task 2"],
      big: false,
    },
    {
      icon: <IconMic />,
      title: t("Speaking Mock Interviews", "Speaking sinov suhbatlari"),
      desc: t(
        "Talk through real Part 1–3 questions with an AI examiner that listens for fluency, coherence and vocabulary range — then grades you on the spot.",
        "AI imtihonchi bilan haqiqiy 1–3-qism savollarini muhokama qiling — ravonlik, izchillik va leksik diapazonni tinglab, darhol baholaydi."
      ),
      tags: [t("Part 1–3", "1–3-qism"), t("Fluency", "Ravonlik"), t("Vocabulary", "Leksika")],
      big: true,
    },
    {
      icon: <IconHeadphones />,
      title: t("Listening Practice", "Eshitish mashqi"),
      desc: t(
        "Timed listening sets with the accents and question types that actually show up on test day.",
        "Imtihon kuni uchraydigan urg'ular va savol turlari bilan vaqtlangan eshitish to'plamlari."
      ),
      tags: [t("Accents", "Urg'ular"), t("Timed sets", "Vaqtlangan to'plamlar")],
      big: false,
    },
    {
      icon: <IconReading />,
      title: t("Reading Practice", "O'qish mashqi"),
      desc: t(
        "Passage-based drills that build skimming speed and answer-matching accuracy under real time limits.",
        "Haqiqiy vaqt chegarasida tezlik va javob moslashtirish aniqligini rivojlantiruvchi matn asosidagi mashqlar."
      ),
      tags: [t("Skimming", "Tezkor o'qish"), t("Matching", "Moslashtirish")],
      big: false,
    },
    {
      icon: <IconCheck />,
      title: t("Grammar Precision", "Grammatika aniqligi"),
      desc: t(
        "Targeted drills for the small grammar slips that quietly cap Band 6 writers at Band 6.",
        "Band 6 yozuvchilarni jimgina Band 6 da ushlab turadigan kichik grammatika xatolari uchun maqsadli mashqlar."
      ),
      tags: [t("Range", "Diapazon"), t("Accuracy", "Aniqlik")],
      big: false,
    },
    {
      icon: <IconPronunc />,
      title: t("Pronunciation Coach", "Talaffuz murabbiy"),
      desc: t(
        "Sound-by-sound feedback on the words that cost Speaking marks most often for Uzbek speakers.",
        "O'zbek so'zlovchilar uchun Speaking ballini ko'pincha kamaytiruvchi so'zlar bo'yicha tovush-tovush izohi."
      ),
      tags: [t("Sound drills", "Tovush mashqlari")],
      big: false,
    },
    {
      icon: <IconTarget />,
      title: t("Weak-Spot Targeting", "Zaif joy maqsadi"),
      desc: t(
        "Your coach tracks every session and keeps steering practice toward whatever's holding your band back.",
        "Murabbiy har bir mashg'ulotni kuzatib boradi va bandingizni ushlab turgan narsaga qarab mashqni yo'naltiradi."
      ),
      tags: [t("Adaptive", "Moslashuvchan")],
      big: false,
    },
  ];

  return (
    <div ref={containerRef} className="lp">
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <header ref={navRef} className="lp-nav">
        <div className="lp-con lp-nav-row">
          <button className="lp-brand" onClick={() => onStart("signup")}>
            <BrandMark />
            IELTS Coach
          </button>
          <nav className="lp-nav-links">
            <a href="#skills">{t("Skills", "Ko'nikmalar")}</a>
            <a href="#how">{t("How it works", "Qanday ishlaydi")}</a>
            <a href="#pricing">{t("Get started", "Boshlash")}</a>
          </nav>
          <div className="lp-nav-actions">
            <div className="lp-lang" role="group">
              {[["en", "EN"], ["uz", "UZ"]].map(([k, l]) => (
                <button key={k} onClick={() => onLang(k)} className={lang === k ? "active" : ""}>{l}</button>
              ))}
            </div>
            <button onClick={() => onStart("login")} style={{ border: `1px solid ${borderLine}`, background: paper, padding: "11px 18px", borderRadius: 999, fontWeight: 700, fontSize: 13.5, color: ink, transition: "all .2s" }}>
              {t("Log in", "Kirish")}
            </button>
            <button onClick={() => onStart("signup")} className="lp-btn lp-btn-primary" style={{ padding: "11px 20px", fontSize: 13.5 }}>
              {t("Start free", "Bepul boshlash")}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="lp-hero">
        <div className="lp-blob lp-blob-1" aria-hidden="true" />
        <div className="lp-blob lp-blob-2" aria-hidden="true" />
        <div className="lp-blob lp-blob-3" aria-hidden="true" />
        <div className="lp-grain" aria-hidden="true" />

        <div className="lp-con lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">
              <span className="lp-dot" />
              {t("AI IELTS Instructor · Available 24/7", "AI IELTS Murabbiy · 24/7 mavjud")}
            </span>
            <h1 className="lp-hero-h1">
              {t("Vocabulary. Writing. Speaking.", "Lug'at. Yozuv. Gaplashuv.")}<br />
              <em>{t("One coach who scores it all.", "Hammasini baholaydigan bitta murabbiy.")}</em>
            </h1>
            <p className="lp-lede">
              {t(
                "Practice every part of IELTS with an AI coach trained on real band descriptors. Get Writing and Speaking feedback in seconds, build vocabulary that sticks, and track your progress across every skill.",
                "Haqiqiy band tavsifnomalari asosida o'qitilgan AI murabbiy bilan IELTSning har qismini mashq qiling. Soniyalar ichida yozuv va nutq izohlari oling, so'z boyligingizni mustahkamlang."
              )}
            </p>
            <div className="lp-hero-actions">
              <button onClick={() => onStart("signup")} className="lp-btn lp-btn-primary">
                {t("Start your free diagnostic", "Bepul diagnostikani boshlash")}
              </button>
              <button onClick={() => onStart("login")} className="lp-btn lp-btn-ghost">
                {t("Log in →", "Kirish →")}
              </button>
            </div>
            <div className="lp-hero-trust">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: green, fontWeight: 800 }}>✓</span>
                {t("No credit card needed", "Kredit karta shart emas")}
              </span>
              <span style={{ color: borderLine }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: green, fontWeight: 800 }}>✓</span>
                {t("First feedback in < 60 s", "Birinchi izoh < 60 soniyada")}
              </span>
              <span style={{ color: borderLine }}>·</span>
              <span>EN · UZ · RU</span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-float-chip lp-chip-1">
              <span className="lp-chip-dot" style={{ background: green }} />
              {t("Band 7.5 reached", "Band 7.5 erishildi")}
            </div>
            <div className="lp-float-chip lp-chip-2">
              <span className="lp-chip-dot" style={{ background: coral }} />
              +120 {t("words learned", "so'z o'rganildi")}
            </div>

            <div ref={gradeCardRef} className="lp-grade-card">
              <div className="lp-card-head">
                <span className="lp-grade-tag">Writing Task 2 · {t("Live feedback", "Jonli izoh")}</span>
                <span className="lp-grade-live"><i />{t("Grading", "Baholanmoqda")}</span>
              </div>
              <div className="lp-essay-box">
                <span ref={essayTextRef} /><span className="lp-cursor" />
              </div>
              <div className="lp-score-row">
                <div ref={scoreBadgeRef} className="lp-score-badge">0.0</div>
                <div className="lp-score-meta">{t("Overall", "Umumiy")}<br />{t("Band Score", "Band Baho")}</div>
              </div>
              <div className="lp-criteria">
                {[
                  [t("Task Response", "Vazifa javob"), "7.5"],
                  [t("Coherence & Cohesion", "Izchillik"), "7.0"],
                  [t("Lexical Resource", "Leksika"), "7.5"],
                  [t("Grammar Range", "Grammatika"), "7.0"],
                ].map(([label, score], i) => (
                  <div key={i} className="lp-criteria-row">
                    <div className="lp-criteria-label"><span>{label}</span><span>{score}</span></div>
                    <div className="lp-bar-track">
                      <div className="lp-bar-fill" ref={(el) => { barRefs.current[i] = el; }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lp-scroll-cue">
          <span>{t("Scroll", "Pastga")}</span>
          <span className="lp-scline" />
        </div>
      </section>

      {/* ── METAMORPHOSIS ── */}
      <section className="lp-meta">
        <div className="lp-con lp-meta-track">
          <div className="lp-meta-row">
            <div ref={metaIconRef} className="lp-meta-icon">
              <svg ref={metaCocoonRef} className="lp-meta-cocoon" viewBox="0 0 40 56" fill="none" strokeWidth="1.6" strokeLinecap="round">
                <path d="M20 2v6" />
                <ellipse cx="20" cy="34" rx="13" ry="20" />
                <path d="M8 22c8 3 16 3 24 0" />
                <path d="M7 32c8 3 18 3 26 0" />
                <path d="M8 42c8 3 16 3 24 0" />
              </svg>
              <svg ref={metaButterflyRef} className="lp-meta-butterfly" viewBox="0 0 40 40" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 8c-2-4-6-6-6-6" />
                <path d="M20 8c2-4 6-6 6-6" />
                <line x1="20" y1="9" x2="20" y2="32" />
                <path className="lp-wing" d="M20 11c-6-9-18-8-18 1 0 7 8 10 18 6z" fill="rgba(255,106,77,0.2)" />
                <path className="lp-wing lp-wing-r" d="M20 11c6-9 18-8 18 1 0 7-8 10-18 6z" fill="rgba(255,106,77,0.2)" />
                <path className="lp-wing" d="M20 20c-5-6-13-4-13 3 0 5 6 7 13 4z" fill="rgba(255,106,77,0.2)" />
                <path className="lp-wing lp-wing-r" d="M20 20c5-6 13-4 13 3 0 5-6 7-13 4z" fill="rgba(255,106,77,0.2)" />
              </svg>
            </div>
            <div className="lp-meta-copy">
              <span className="lp-eyebrow"><span className="lp-dot" />{t("Your transformation", "Sizning o'zgarishingiz")}</span>
              <h2 className="lp-meta-h2">
                {t("Every learner starts in a", "Har bir o'quvchi")} <em>{t("cocoon.", "g'umbakda boshlaydi.")}</em>{" "}
                {t("You leave at Band 7.5.", "Siz Band 7.5 bilan chiqasiz.")}
              </h2>
              <p>
                {t(
                  "No one walks in fluent. Your coach meets you at Band 5, 5.5, or 6 — and works every session toward the version of you that walks out ready.",
                  "Hech kim tayyor holda kelmaydi. Murabbiy sizni Band 5, 5.5 yoki 6 dan qabul qiladi va har mashg'ulotda tayyor versiyangizga qarab ishlaydi."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS — honest product facts, no fabricated numbers ── */}
      <section className="lp-stats">
        <div className="lp-con lp-stats-grid">
          {[
            { num: "< 60", suf: " s", label: t("To your first AI-graded feedback", "Birinchi AI bahoingizgacha") },
            { num: "4", suf: "", label: t("Official IELTS criteria scored every time", "Har safar 4 rasmiy IELTS mezoni baholanadi") },
            { num: "3", suf: "", label: t("Languages: English, O'zbekcha, Русский", "Tillar: English, O'zbekcha, Русский") },
            { num: "24/7", suf: "", label: t("Practice anytime — no booking needed", "Istalgan vaqt mashq qiling — bron kerak emas") },
          ].map(({ num, suf, label }, i) => (
            <div key={i} className="lp-stat-card lp-reveal">
              <div className="lp-stat-num">{num}{suf}</div>
              <div className="lp-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DARK NETWORK ── */}
      <section className="lp-network">
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="lp-con lp-network-inner">
          <div className="lp-network-head lp-reveal">
            <span className="lp-eyebrow"><span className="lp-dot" />{t("Under the hood", "Qanday ishlaydi")}</span>
            <h2 className="lp-network-h2">
              {t("An examiner that studied every", "Har bir")}{" "}
              <em>{t("band descriptor", "band tavsifnomasi")}</em>
              {t(" — so you don't have to guess your score.", " ni o'rganib chiqqan imtihonchi.")}
            </h2>
            <p>
              {t(
                "Your coach doesn't just mark right or wrong. It scores Writing and Speaking against the same four criteria real IELTS examiners use, then explains exactly what to fix before test day.",
                "Murabbiy shunchaki to'g'ri-noto'g'ri deb belgilamaydi. U Writing va Speakingni haqiqiy IELTS imtihonchilar ishlatadigan 4 mezon bo'yicha baholaydi va imtihon oldidan nima tuzatishni aniq tushuntiradi."
              )}
            </p>
          </div>
          <div className="lp-nf-grid">
            {[
              {
                icon: <IconBolt />,
                title: t("Instant, consistent scores", "Bir zumda, izchil baholar"),
                desc: t("The same rubric, every time — no good-mood or bad-mood examiner.", "Har safar bir xil rubrika — kayfiyatga bog'liq bo'lmagan imtihonchi."),
              },
              {
                icon: <IconClock />,
                title: t("Feedback that explains why", "Sababini tushuntiradigan izoh"),
                desc: t("Every score comes with the specific sentence or word that cost you marks.", "Har bir baho siz ball yo'qotgan aniq gap yoki so'z bilan birga keladi."),
              },
              {
                icon: <IconGlobe />,
                title: "English, O'zbekcha " + t("or", "yoki") + " Русский",
                desc: t("Instructions and feedback in the language you think in.", "Ko'rsatmalar va izohlar siz o'ylaydigan tilda."),
              },
            ].map((item, i) => (
              <div key={i} className="lp-nf-card lp-reveal">
                <div className="lp-nf-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section className="lp-skills" id="skills">
        <div className="lp-con">
          <div className="lp-sec-head">
            <span className="lp-eyebrow"><span className="lp-dot" />{t("Every skill, one coach", "Har bir ko'nikma, bitta murabbiy")}</span>
            <h2>{t("Tons of skills. One clear path to", "Ko'p ko'nikmalar. ")} <em>{t("Band 7.5.", "Band 7.5")}</em>{t("", "ga aniq yo'l.")}</h2>
            <p>{t("Every module targets a real part of the IELTS score — and your coach keeps steering practice toward whichever one is holding you back.", "Har bir modul IELTSning haqiqiy qismini maqsad qiladi — murabbiy esa sizni orqada ushlab turgan qismga yo'naltiradi.")}</p>
          </div>
          <div className="lp-skills-grid">
            {skillCards.map((card, i) => (
              <div key={i} className={`lp-skill-card${card.big ? " big" : ""} lp-reveal`}>
                <div>
                  <div className="lp-skill-icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <div className="lp-skill-tags">{card.tags.map((tag, j) => <span key={j}>{tag}</span>)}</div>
                </div>
                {card.big && (
                  <div className="lp-waveform" aria-hidden="true">
                    {[0, 0.1, 0.2, 0.3, 0.15, 0.25, 0.05, 0.35, 0.2, 0.1].map((d, j) => (
                      <i key={j} style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="lp-process" id="how">
        <div className="lp-con">
          <div className="lp-sec-head">
            <span className="lp-eyebrow"><span className="lp-dot" />{t("How it works", "Qanday ishlaydi")}</span>
            <h2>{t("From first guess to", "Birinchi taxminden")} <em>{t("Band 7.5", "Band 7.5")}</em>{t(", in four steps.", ", to'rt qadamda.")}</h2>
            <p>{t("No generic course to sit through — just a path built around your actual gaps.", "O'tirish uchun umumiy kurs yo'q — faqat sizning haqiqiy kamchiliklaringizga asoslangan yo'l.")}</p>
          </div>
          <div className="lp-process-track">
            <div className="lp-process-line" aria-hidden="true">
              <svg viewBox="0 0 1000 2" preserveAspectRatio="none">
                <path d="M0,1 L1000,1" stroke={borderLine} strokeWidth="2" fill="none" />
                <path ref={processLineRef} d="M0,1 L1000,1" stroke={coral} strokeWidth="2" fill="none" strokeDasharray="1000" strokeDashoffset="1000" />
              </svg>
            </div>
            {[
              { n: "01", title: t("Take your diagnostic", "Diagnostikangizni oling"), desc: t("10 minutes across all four skills tells us your starting band.", "Barcha to'rt ko'nikma bo'yicha 10 daqiqa boshlang'ich bandingizni ko'rsatadi.") },
              { n: "02", title: t("Get a plan built for you", "Siz uchun reja oling"), desc: t("Not a generic course — a study path that hits your weakest skills first.", "Umumiy kurs emas — eng zaif ko'nikmalaringizni birinchi maqsad qiladigan yo'l.") },
              { n: "03", title: t("Practice with instant feedback", "Bir zumda izoh bilan mashq qiling"), desc: t("Write, speak and drill vocabulary with AI grading in seconds, not days.", "Soniyalar ichida AI baholash bilan yozing, gaplashing va lug'at mashq qiling.") },
              { n: "04", title: t("Watch your band score move", "Band bahongizchnig o'sishini kuzating"), desc: t("Every mock exam feeds your progress history, so growth is never a guess.", "Har bir sinov tarixingizga qo'shiladi — o'sish hech qachon taxmin emas.") },
            ].map((step, i) => (
              <div key={i} className="lp-step lp-reveal">
                <div className="lp-step-num">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEEDBACK EXAMPLES (replaces fabricated testimonials) ── */}
      <section className="lp-feedback" id="stories">
        <div className="lp-con">
          <div className="lp-sec-head">
            <span className="lp-eyebrow"><span className="lp-dot" />{t("Example feedback", "Namuna izoh")}</span>
            <h2>{t("Here's what your", "Mana sizning")} <em>{t("coach delivers", "murabbiyingiz nima beradi")}</em>{t(" — every session.", " — har mashg'ulotda.")}</h2>
            <p>{t("Not ratings — concrete, actionable feedback on what to fix right now.", "Reytinglar emas — hoziroq nima tuzatish kerakligini aniq ko'rsatadigan izoh.")}</p>
          </div>
          <div className="lp-feedback-grid">
            {/* Card 1: Grammar/lexical correction */}
            <div className="lp-fb-card lp-reveal">
              <span className="lp-fb-label">{t("Writing correction", "Yozuv tuzatish")}</span>
              <h4>{t("Lexical Resource · example fix", "Leksika · namuna tuzatish")}</h4>
              <div className="lp-fb-row">
                <span className="lp-fb-icon err">✕</span>
                <span><em style={{ textDecoration: "line-through", color: inkSoft }}>"very important"</em> — {t("basic, overused", "oddiy, ko'p ishlatilgan")}</span>
              </div>
              <div className="lp-fb-row">
                <span className="lp-fb-icon fix">✓</span>
                <span><strong>"crucial"</strong> / <strong>"pivotal"</strong> — {t("stronger, academic", "kuchliroq, akademik")}</span>
              </div>
              <div className="lp-fb-row note">
                <span>{t("Rule: stronger adjectives reduce repetition and signal a wider lexical range.", "Qoida: kuchli sifatlar takrorni kamaytiradi va kengroq leksik diapazonni ko'rsatadi.")}</span>
              </div>
            </div>
            {/* Card 2: Band breakdown */}
            <div className="lp-fb-card lp-reveal">
              <span className="lp-fb-label">{t("Band breakdown", "Band taqsimoti")}</span>
              <h4>{t("Writing Task 2 · Overall 7.5", "Yozuv Task 2 · Umumiy 7.5")}</h4>
              {[
                [t("Task Response", "Vazifa javob"), "7.5", "88%"],
                [t("Coherence & Cohesion", "Izchillik"), "7.0", "80%"],
                [t("Lexical Resource", "Leksika"), "8.0", "92%"],
                [t("Grammar Range", "Grammatika"), "7.5", "88%"],
              ].map(([label, band, width], j) => (
                <div key={j} className="lp-fb-band-row">
                  <span style={{ minWidth: 110, fontSize: 12.5, color: inkSoft }}>{label}</span>
                  <div className="lp-fb-bar-track"><div className="lp-fb-bar-fill" style={{ width }} /></div>
                  <span className="lp-fb-band-pill">{band}</span>
                </div>
              ))}
            </div>
            {/* Card 3: Speaking feedback */}
            <div className="lp-fb-card lp-reveal">
              <span className="lp-fb-label">{t("Speaking feedback", "Speaking izohi")}</span>
              <h4>{t("Fluency & Coherence · example note", "Ravonlik · namuna izoh")}</h4>
              <div className="lp-fb-row">
                <span className="lp-fb-icon err">→</span>
                <span>{t("Repeated filler", "Takroriy to'ldiruvchi")}: <em style={{ color: inkSoft }}>"basically, basically…"</em></span>
              </div>
              <div className="lp-fb-row">
                <span className="lp-fb-icon fix">✓</span>
                <span>{t("Try", "Ko'ring")}: <strong>"To be more specific…"</strong></span>
              </div>
              <div className="lp-fb-row note">
                <span>{t("Reducing repetition is the fastest path from Band 6.5 to 7.0 in Fluency.", "Takrorni kamaytirish Ravonlikda Band 6.5 dan 7.0 ga o'tishning eng tez yo'li.")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-final" id="pricing">
        <svg className="lp-final-wm" viewBox="0 0 40 40" fill="none" stroke={gold} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="20" y1="9" x2="20" y2="32" />
          <path d="M20 11c-6-9-18-8-18 1 0 7 8 10 18 6z" />
          <path d="M20 11c6-9 18-8 18 1 0 7-8 10-18 6z" />
          <path d="M20 20c-5-6-13-4-13 3 0 5 6 7 13 4z" />
          <path d="M20 20c5-6 13-4 13 3 0 5-6 7-13 4z" />
        </svg>
        <h2>{t("Your", "Sizning")} <em>{t("Band 7.5", "Band 7.5")}</em> {t("starts today.", "bugun boshlanadi.")}</h2>
        <p>{t("Free diagnostic across Vocabulary, Writing, Speaking — no credit card needed.", "Lug'at, Yozuv, Gaplashuv bo'yicha bepul diagnostika — kredit karta shart emas.")}</p>
        <button onClick={() => onStart("signup")} className="lp-btn lp-btn-light" style={{ marginTop: 34 }}>
          {t("Start your free diagnostic →", "Bepul diagnostikani boshlash →")}
        </button>
        <small>{t("First feedback in under a minute · English, O'zbekcha, Русский", "Birinchi izoh bir daqiqada · English, O'zbekcha, Русский")}</small>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="lp-con">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <span className="lp-brand" style={{ cursor: "default" }}>
                <BrandMark />
                IELTS Coach
              </span>
              <p>{t("An AI IELTS coach for Vocabulary, Writing and Speaking — built for Uzbek students chasing Band 7+.", "Lug'at, Yozuv va Gaplashuv uchun AI IELTS murabbiy — Band 7+ ni maqsad qilgan o'zbek talabalar uchun.")}</p>
            </div>
            <div className="lp-footer-cols">
              <div className="lp-footer-col">
                <h4>{t("Practice", "Mashq")}</h4>
                <a href="#skills">{t("Vocabulary", "Lug'at")}</a>
                <a href="#skills">{t("Writing", "Yozuv")}</a>
                <a href="#skills">{t("Speaking", "Gaplashuv")}</a>
                <a href="#how">{t("How it works", "Qanday ishlaydi")}</a>
              </div>
              <div className="lp-footer-col">
                <h4>{t("Account", "Hisob")}</h4>
                <a onClick={() => onStart("signup")}>{t("Sign up free", "Bepul ro'yxatdan o'ting")}</a>
                <a onClick={() => onStart("login")}>{t("Log in", "Kirish")}</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} IELTS Coach</span>
            <span>{t("Made for Uzbekistan's IELTS candidates.", "O'zbekiston IELTS da'vogarlari uchun.")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
