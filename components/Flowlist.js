'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { saveAppState, loadAppState } from '../lib/db';

// ─── Helpers ───
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().split("T")[0]}
function todayStr(){return new Date().toISOString().split("T")[0]}
function gid(){return"t"+Date.now()+Math.random().toString(36).slice(2,6)}
function fmtDate(s){if(!s)return"—";const d=new Date(s+"T00:00:00");return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]+" "+d.getDate()}
function daysUntil(s){const n=new Date();n.setHours(0,0,0,0);const diff=Math.ceil((new Date(s+"T00:00:00")-n)/864e5);if(diff===0)return"today";if(diff===1)return"tomorrow";if(diff<0)return`${Math.abs(diff)}d overdue`;return`${diff}d`}
function fmtTimer(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function fmtMins(m){if(!m||m<=0)return"0m";if(m<60)return`${m}m`;const h=Math.floor(m/60),r=m%60;return r>0?`${h}h ${r}m`:`${h}h`}
const COLORS=["#00FF9F","#00D4FF","#FFB800","#FF5F5F","#C084FC","#FF6B9D","#4ADE80"];
const DEFAULT_HATS=[];
const BRAND_NAME=process.env.NEXT_PUBLIC_BRAND_NAME||"flowlist";
const BRAND_TAGLINE=process.env.NEXT_PUBLIC_BRAND_TAGLINE||"// wear many hats. stay in flow.";
const BRAND_LOGO_SRC=process.env.NEXT_PUBLIC_BRAND_LOGO_SRC||"/company-logo.png";

// ─── CSS ───
const CSS=`
:root{
  --bg:#09090B;--bg2:#111113;--bg3:#18181B;--border:rgba(255,255,255,.06);
  --text:#E4E4E7;--dim:rgba(228,228,231,.4);--dim2:rgba(228,228,231,.2);
  --green:#00FF9F;--greendim:rgba(0,255,159,.12);--greenbord:rgba(0,255,159,.25);
  --cyan:#00D4FF;--cyandim:rgba(0,212,255,.1);
  --amber:#FFB800;--amberdim:rgba(255,184,0,.1);--amberbord:rgba(255,184,0,.25);
  --red:#FF5F5F;--reddim:rgba(255,95,95,.1);
  --purple:#C084FC;--purpledim:rgba(192,132,252,.1);
  --mono:'JetBrains Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{opacity:.4}50%{opacity:.7}}
@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:.65}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}

*{box-sizing:border-box;margin:0;padding:0}
body,html{font-family:var(--sans);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
.app{min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden}
.scanline{position:fixed;top:0;left:0;right:0;height:2px;background:rgba(0,255,159,.03);pointer-events:none;z-index:0;animation:scanline 8s linear infinite}
.cg1{position:fixed;top:-150px;right:-150px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,159,.04) 0%,transparent 70%);pointer-events:none;animation:glow 6s ease-in-out infinite;z-index:0}
.cg2{position:fixed;bottom:-200px;left:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.03) 0%,transparent 70%);pointer-events:none;animation:glow 8s ease-in-out infinite 2s;z-index:0}
.wrap{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:20px}

.hdr{display:flex;justify-content:space-between;align-items:center;padding:20px 0 28px;animation:fadeIn .5s ease;flex-wrap:wrap;gap:12px}
.logo{font-family:var(--mono);font-size:22px;font-weight:700;letter-spacing:-1px;color:var(--green);text-shadow:0 0 20px rgba(0,255,159,.3)}.logo span{color:var(--dim);font-weight:300}
.nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tabs{display:flex;gap:2px;background:var(--bg2);border-radius:8px;padding:3px;border:1px solid var(--border)}
.tab{padding:7px 16px;border:none;background:transparent;color:var(--dim);font-family:var(--mono);font-size:12px;font-weight:500;border-radius:6px;cursor:pointer;transition:all .2s;letter-spacing:.5px}
.tab.on{background:var(--greendim);color:var(--green);text-shadow:0 0 8px rgba(0,255,159,.3)}
.tab:hover:not(.on):not(:disabled){color:var(--text)}.tab:disabled{opacity:.25;cursor:not-allowed}
.ibtn{padding:6px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--dim);font-size:12px;cursor:pointer;transition:all .2s;font-family:var(--mono);display:flex;align-items:center;gap:6px}
.ibtn:hover{background:var(--bg3);color:var(--text);border-color:rgba(255,255,255,.1)}

/* Saving indicator */
.save-dot{width:8px;height:8px;border-radius:50%;transition:all .3s}
.save-dot.saving{background:var(--amber);animation:blink .8s ease-in-out infinite}
.save-dot.saved{background:var(--green)}
.save-dot.error{background:var(--red)}

/* Picker */
.pkwrap{position:relative}
.pkmenu{position:absolute;top:calc(100% + 8px);right:0;min-width:340px;max-height:450px;overflow-y:auto;background:var(--bg2);border:1px solid rgba(0,255,159,.15);border-radius:10px;padding:8px;z-index:100;animation:fadeIn .15s ease;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 1px rgba(0,255,159,.2)}
.pkhat{padding:4px 10px;margin-top:10px}.pkhat:first-child{margin-top:4px}
.pkhn{font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;margin-bottom:6px}
.pktask{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;transition:all .12s;font-size:12px;color:rgba(228,228,231,.6);font-family:var(--sans)}
.pktask:hover{background:rgba(0,255,159,.06);color:var(--text)}
.pktask .dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.pktask .ms{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--dim2)}
.pktask .du{font-family:var(--mono);font-size:10px;color:var(--dim2);margin-left:4px}
.pktask-sub{padding-left:25px;font-size:11px;color:rgba(228,228,231,.45)}.pktask-sub:hover{color:var(--text)}
.pkempty{padding:16px;text-align:center;color:var(--dim2);font-size:12px}

.startb{background:var(--bg2);border:1px solid var(--greenbord);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;animation:fadeIn .5s ease;position:relative;overflow:hidden}
.startb::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--green),transparent);opacity:.4}
.startb h2{font-family:var(--mono);font-size:20px;font-weight:600;margin-bottom:6px}
.startb p{font-size:13px;color:var(--dim);margin-bottom:20px}
.gobtn{padding:12px 36px;border-radius:6px;border:1px solid var(--greenbord);background:var(--greendim);color:var(--green);font-family:var(--mono);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-shadow:0 0 8px rgba(0,255,159,.3);letter-spacing:.5px}
.gobtn:hover{background:rgba(0,255,159,.2);box-shadow:0 0 20px rgba(0,255,159,.15)}

.greet{font-family:var(--mono);font-size:24px;font-weight:600;margin-bottom:4px;animation:fadeIn .5s ease .1s both}
.sgreet{font-size:13px;color:var(--dim);margin-bottom:32px;animation:fadeIn .5s ease .2s both;font-family:var(--mono);font-weight:300}
.sgreet .ts{color:var(--green);font-weight:500}

.summary{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:24px;animation:fadeIn .5s ease .15s both;display:flex;gap:28px;flex-wrap:wrap}
.stn{font-family:var(--mono);font-size:24px;font-weight:700}
.stl{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:1px;margin-top:2px;text-transform:uppercase}

.hgrid{display:grid;grid-template-columns:1fr;gap:20px}
@media(min-width:768px){.hgrid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.hgrid{grid-template-columns:repeat(3,1fr)}}
.hcard{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px;animation:slideUp .4s ease both;transition:border-color .2s}
.hcard:hover{border-color:rgba(255,255,255,.1)}
.hcard-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.hcard-name{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
.hcard-cnt{font-family:var(--mono);font-size:10px;color:var(--dim2)}

.titem{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--border);animation:fadeIn .3s ease both;transition:opacity .2s}
.titem:last-child{border-bottom:none}.titem.done{opacity:.3}
.tchk{width:18px;height:18px;min-width:18px;border-radius:4px;border:1.5px solid rgba(255,255,255,.15);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;margin-top:2px}
.tchk:hover{border-color:rgba(255,255,255,.3)}
.tchk.on{border-color:var(--green);background:var(--greendim)}.tchk.on::after{content:"✓";color:var(--green);font-size:11px;font-weight:700}
.tcont{flex:1;min-width:0}.ttxt{font-size:13px;line-height:1.5;font-weight:400}
.titem.done .ttxt{text-decoration:line-through;color:var(--dim)}
.tmeta{display:flex;gap:6px;margin-top:5px;font-size:10px;color:var(--dim2);font-family:var(--mono);flex-wrap:wrap;align-items:center}
.tmeta .over{color:var(--red)}
.badge{padding:1px 6px;border-radius:3px;font-size:9px;font-weight:600;letter-spacing:.5px;font-family:var(--mono)}
.b-proj{background:var(--purpledim);color:var(--purple)}
.b-today{background:var(--amberdim);color:var(--amber)}
.b-time{background:var(--cyandim);color:var(--cyan)}
.tacts{display:flex;gap:4px;align-items:flex-start;margin-top:2px;flex-shrink:0}
.sel{padding:3px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--dim);font-size:10px;cursor:pointer;font-family:var(--mono);transition:all .15s;white-space:nowrap}
.sel:hover{border-color:rgba(255,255,255,.2);color:var(--text)}
.sel.on{background:var(--amberdim);border-color:var(--amberbord);color:var(--amber)}
.xbtn{background:none;border:none;color:var(--dim2);cursor:pointer;font-size:14px;padding:2px 4px;transition:color .15s;line-height:1}.xbtn:hover{color:var(--red)}

.ptog{padding:3px 8px;border-radius:4px;border:1px solid rgba(192,132,252,.2);background:var(--purpledim);color:var(--purple);font-size:10px;cursor:pointer;font-family:var(--mono);transition:all .15s;white-space:nowrap}
.ptog:hover{background:rgba(192,132,252,.18)}

.subs{margin-top:8px;margin-left:28px;padding:12px 14px;background:rgba(255,255,255,.015);border-radius:8px;border:1px solid var(--border);animation:fadeIn .2s ease}
.subhdr{font-family:var(--mono);font-size:10px;color:var(--dim2);margin-bottom:6px;letter-spacing:.5px}
.spbar{height:2px;background:rgba(255,255,255,.04);border-radius:1px;margin-bottom:8px;overflow:hidden}
.spfill{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--green),var(--cyan));transition:width .3s}
.sub{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.02);font-size:12px}
.sub:last-of-type{border-bottom:none}
.subchk{width:14px;height:14px;min-width:14px;border-radius:3px;border:1.5px solid rgba(255,255,255,.1);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.subchk.on{border-color:var(--green);background:var(--greendim)}.subchk.on::after{content:"✓";color:var(--green);font-size:9px;font-weight:700}
.sub-txt{color:rgba(228,228,231,.6);flex:1}.sub.done .sub-txt{text-decoration:line-through;color:var(--dim2)}
.sub-r{display:flex;gap:4px;align-items:center;flex-shrink:0}
.sub-min{font-family:var(--mono);font-size:9px;color:var(--dim2)}
.sub-sel{padding:2px 6px;border-radius:3px;border:1px solid var(--border);background:transparent;color:var(--dim2);font-size:9px;cursor:pointer;font-family:var(--mono);transition:all .12s}
.sub-sel:hover{border-color:rgba(255,255,255,.15);color:var(--text)}
.sub-sel.on{background:var(--amberdim);border-color:var(--amberbord);color:var(--amber)}
.addsub{display:flex;gap:6px;margin-top:8px}
.addsub input{flex:1;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,.02);color:var(--text);font-family:var(--sans);font-size:11px;outline:none}
.addsub input:focus{border-color:rgba(192,132,252,.3)}.addsub input::placeholder{color:var(--dim2)}
.mbtn{padding:3px 10px;border:none;border-radius:4px;font-family:var(--mono);font-size:10px;cursor:pointer;transition:all .15s}

.addbtn{width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;background:transparent;color:var(--dim2);font-family:var(--mono);font-size:11px;cursor:pointer;transition:all .2s;margin-top:10px}
.addbtn:hover{border-color:rgba(255,255,255,.12);color:var(--dim);background:rgba(255,255,255,.01)}
.aform{margin-top:10px;padding:14px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid var(--border);animation:fadeIn .2s}
.aform input{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.02);color:var(--text);font-family:var(--sans);font-size:13px;margin-bottom:8px;outline:none;transition:border-color .15s}
.aform input:focus{border-color:var(--greenbord)}.aform input::placeholder{color:var(--dim2)}
.afrow{display:flex;gap:8px}.afrow input{flex:1}
.fbtns{display:flex;gap:6px;margin-top:4px}
.fbtn{padding:7px 18px;border-radius:6px;border:none;font-family:var(--mono);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}
.fbtn-p{background:var(--greendim);color:var(--green);border:1px solid var(--greenbord)}.fbtn-p:hover{background:rgba(0,255,159,.2)}
.fbtn-s{background:transparent;color:var(--dim);border:1px solid transparent}.fbtn-s:hover{color:var(--text)}

.ahsec{margin-top:20px;animation:fadeIn .5s ease .3s both}
.ahbtn{padding:12px 20px;border:1px dashed var(--border);border-radius:10px;background:transparent;color:var(--dim2);font-family:var(--mono);font-size:12px;cursor:pointer;transition:all .2s}
.ahbtn:hover{border-color:rgba(255,255,255,.12);color:var(--dim)}
.ahform{display:inline-flex;gap:8px;align-items:center;animation:fadeIn .2s}
.ahform input{padding:8px 14px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.02);color:var(--text);font-family:var(--mono);font-size:13px;outline:none;width:200px}
.ahform input:focus{border-color:var(--greenbord)}

.wmode{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:55vh;text-align:center;animation:fadeIn .6s ease}
.what{font-family:var(--mono);font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:12px;opacity:.5}
.wtxt{font-family:var(--mono);font-size:clamp(22px,5vw,44px);font-weight:600;line-height:1.35;max-width:700px;animation:fadeIn .4s ease;margin-bottom:6px;letter-spacing:-.5px}
.wmeta{font-family:var(--mono);font-size:12px;color:var(--dim);margin-bottom:10px}
.timer-acc{font-family:var(--mono);font-size:11px;color:rgba(0,212,255,.5);margin-bottom:4px}
.timer{font-family:var(--mono);font-size:clamp(36px,8vw,56px);font-weight:300;letter-spacing:3px;margin-bottom:4px;color:var(--text);min-height:56px}
.timer.run{animation:timerPulse 2s ease-in-out infinite;color:var(--green);text-shadow:0 0 20px rgba(0,255,159,.3)}
.timer-lbl{font-family:var(--mono);font-size:11px;color:var(--dim2);margin-bottom:24px}.timer-lbl .cursor{animation:blink 1s step-end infinite}
.wactions{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;justify-content:center}
.wact{padding:10px 24px;border-radius:6px;border:1px solid var(--border);background:var(--bg2);color:var(--dim);font-family:var(--mono);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;letter-spacing:.5px}
.wact:hover{color:var(--text);border-color:rgba(255,255,255,.15)}.wact:disabled{opacity:.2;cursor:not-allowed}
.wact-start{border-color:var(--greenbord);color:var(--green);background:var(--greendim)}.wact-start:hover:not(:disabled){background:rgba(0,255,159,.18);box-shadow:0 0 12px rgba(0,255,159,.1)}
.wact-finish{border-color:var(--amberbord);color:var(--amber);background:var(--amberdim)}.wact-finish:hover:not(:disabled){background:rgba(255,184,0,.15)}
.wact-revisit{border-color:rgba(0,212,255,.25);color:var(--cyan);background:var(--cyandim)}.wact-revisit:hover:not(:disabled){background:rgba(0,212,255,.15)}
.shuf{padding:8px 20px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--dim2);font-family:var(--mono);font-size:11px;cursor:pointer;transition:all .2s}
.shuf:hover:not(:disabled){color:var(--dim);background:rgba(255,255,255,.02)}.shuf:disabled{opacity:.2;cursor:not-allowed}
.nowork{font-family:var(--mono);font-size:14px;color:var(--dim);line-height:1.8}

.lock{position:fixed;inset:0;background:var(--bg);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px;overflow-y:auto;padding-top:10vh}
.lock-icon{font-size:40px;margin-bottom:16px}.lock-t{font-family:var(--mono);font-size:22px;font-weight:600;margin-bottom:6px}
.lock-s{font-family:var(--mono);font-size:12px;color:var(--dim);margin-bottom:28px;text-align:center;max-width:380px;line-height:1.6}
.ltasks{width:100%;max-width:420px}
.lhat{font-family:var(--mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-top:16px;margin-bottom:8px;padding-left:4px}
.ltask{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all .15s}
.ltask:hover{background:var(--bg3)}.ltask.chk{background:var(--greendim);border-color:var(--greenbord)}
.lchk{width:18px;height:18px;min-width:18px;border-radius:4px;border:1.5px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;transition:all .15s}
.ltask.chk .lchk{background:var(--greendim);border-color:var(--green)}.ltask.chk .lchk::after{content:"✓";color:var(--green);font-size:11px;font-weight:700}
.ltask-time{font-family:var(--mono);font-size:10px;color:var(--dim2);margin-top:2px}
.ulbtn{margin-top:24px;padding:12px 36px;border-radius:6px;border:none;font-family:var(--mono);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-bottom:40px;letter-spacing:.5px}
.ulbtn.ok{background:var(--greendim);border:1px solid var(--greenbord);color:var(--green);text-shadow:0 0 8px rgba(0,255,159,.3)}.ulbtn.ok:hover{background:rgba(0,255,159,.2);box-shadow:0 0 20px rgba(0,255,159,.1)}
.ulbtn.no{background:var(--bg2);color:var(--dim2);border:1px solid var(--border);cursor:not-allowed}

.arc{animation:fadeIn .5s ease}
.arc-scores{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
.sc{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:18px 24px;text-align:center;animation:fadeIn .4s ease both;min-width:130px;position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;opacity:.3}
.sc:nth-child(1)::before{background:linear-gradient(90deg,transparent,var(--green),transparent)}
.sc:nth-child(2)::before{background:linear-gradient(90deg,transparent,var(--cyan),transparent)}
.sc:nth-child(3)::before{background:linear-gradient(90deg,transparent,var(--amber),transparent)}
.sc-big{font-family:var(--mono);font-size:32px;font-weight:700}
.sc-lbl{font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:1px;margin-top:4px;text-transform:uppercase}
.sc-sub{font-family:var(--mono);font-size:10px;color:var(--dim2);margin-top:2px}

.arc-sec{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;margin-top:24px;padding-left:4px;display:flex;align-items:center;gap:8px}
.arc-sec .cnt{color:var(--dim2);font-weight:400}
.acard{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:8px;animation:fadeIn .25s ease}
.acard-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
.acard-name{font-size:13px;font-weight:500}
.acard-hat{font-family:var(--mono);font-size:9px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase}
.acard-dates{display:flex;gap:14px;margin-top:6px;font-family:var(--mono);font-size:10px;color:var(--dim2)}
.ob{font-family:var(--mono);padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.5px}
.ob-ok{background:var(--greendim);color:var(--green)}.ob-late{background:var(--reddim);color:var(--red)}
.tc{margin-top:8px;display:flex;gap:8px;align-items:center}
.tc-bars{flex:1}
.tc-row{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.tc-lbl{font-family:var(--mono);font-size:9px;color:var(--dim2);width:50px;text-align:right;flex-shrink:0}
.tc-track{flex:1;height:6px;background:rgba(255,255,255,.03);border-radius:3px;overflow:hidden}
.tc-fill{height:100%;border-radius:3px;transition:width .6s ease}
.tc-val{font-family:var(--mono);font-size:9px;color:var(--dim2);width:36px;flex-shrink:0}
.tc-icon{text-align:center;min-width:50px}.tc-emoji{font-size:16px}
.tc-diff{font-family:var(--mono);font-size:9px;color:var(--dim2);margin-top:2px}
.arc-empty{text-align:center;padding:50px 20px;color:var(--dim2);font-family:var(--mono);font-size:13px}

/* Auth */
.auth{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;animation:fadeIn .6s ease}
.auth-card{width:100%;max-width:380px;text-align:center}
.auth-brand{display:flex;flex-direction:column;align-items:center;margin-bottom:16px}
.auth-logo-img{width:120px;max-width:80vw;height:auto;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(0,255,159,.2));margin-bottom:10px}
.auth-logo{font-family:var(--mono);font-size:36px;font-weight:700;color:var(--green);margin-bottom:4px;text-shadow:0 0 30px rgba(0,255,159,.3);letter-spacing:-1px}
.auth-tag{font-family:var(--mono);font-size:12px;color:var(--dim);margin-bottom:36px;letter-spacing:.5px}
.auth-in{width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--text);font-family:var(--mono);font-size:14px;outline:none;margin-bottom:10px;transition:border-color .15s}
.auth-in:focus{border-color:var(--greenbord);box-shadow:0 0 0 2px rgba(0,255,159,.08)}.auth-in::placeholder{color:var(--dim2)}
.auth-go{width:100%;padding:12px;border-radius:8px;border:1px solid var(--greenbord);background:var(--greendim);color:var(--green);font-family:var(--mono);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:4px;text-shadow:0 0 8px rgba(0,255,159,.3);letter-spacing:.5px}
.auth-go:hover{background:rgba(0,255,159,.2);box-shadow:0 0 20px rgba(0,255,159,.12)}
.auth-go:disabled{opacity:.4;cursor:not-allowed}
.auth-switch{margin-top:16px;font-family:var(--mono);font-size:12px;color:var(--dim)}
.auth-switch button{background:none;border:none;color:var(--green);font-family:var(--mono);font-size:12px;cursor:pointer;text-decoration:underline}
.auth-err{font-family:var(--mono);font-size:11px;color:var(--red);margin-top:8px;margin-bottom:8px}
.auth-loading{font-family:var(--mono);font-size:13px;color:var(--dim);margin-top:20px}
.signout-btn{background:none;border:1px solid var(--border);border-radius:4px;padding:4px 10px;color:var(--dim2);font-family:var(--mono);font-size:10px;cursor:pointer;transition:all .15s}
.signout-btn:hover{color:var(--red);border-color:rgba(255,95,95,.3)}

@media(max-width:767px){.wrap{padding:14px}.hdr{padding:14px 0 20px}.greet{font-size:20px}.hcard{padding:16px}.tab{padding:5px 10px;font-size:11px}.summary{padding:14px;gap:16px}.sc{padding:14px 18px;min-width:90px}.sc-big{font-size:24px}.pkmenu{min-width:280px;right:-40px}.timer{font-size:32px!important}}
`;

// ─── Sub Components (same logic as v4, inline) ───
function SubTodoList({todo,hatId,onToggleSub,onSelectSub,onAddSub,mode,dayStarted}){
  const[nt,sNt]=useState("");const[nm,sNm]=useState("30");
  const dc=todo.subTodos.filter(s=>s.done).length;const pct=todo.subTodos.length>0?(dc/todo.subTodos.length)*100:0;
  const add=()=>{if(!nt.trim())return;onAddSub(hatId,todo.id,{id:gid(),text:nt.trim(),minutes:parseInt(nm)||30,done:false,selectedToday:false,timeSpent:0,actualTime:null});sNt("");sNm("30")};
  return(<div className="subs"><div className="subhdr">{dc}/{todo.subTodos.length} sub-tasks</div><div className="spbar"><div className="spfill" style={{width:`${pct}%`}}/></div>
    {todo.subTodos.map(s=>(<div key={s.id} className={`sub ${s.done?'done':''}`}><div className={`subchk ${s.done?'on':''}`} onClick={()=>onToggleSub(hatId,todo.id,s.id)}/><span className="sub-txt">{s.text}</span><div className="sub-r"><span className="sub-min">{s.minutes}m</span>{s.timeSpent>0&&<span className="sub-min" style={{color:'var(--cyan)'}}>{fmtMins(Math.round(s.timeSpent/60))}</span>}{mode==='plan'&&!s.done&&dayStarted&&(<button className={`sub-sel ${s.selectedToday?'on':''}`} onClick={()=>onSelectSub(hatId,todo.id,s.id)}>{s.selectedToday?'✓':'+ today'}</button>)}</div></div>))}
    <div className="addsub"><input placeholder="Sub-task..." value={nt} onChange={e=>sNt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><input placeholder="m" type="number" value={nm} onChange={e=>sNm(e.target.value)} style={{width:48,flex:'none'}}/><button className="mbtn" style={{background:'var(--purpledim)',color:'var(--purple)'}} onClick={add}>+</button></div></div>);
}

function TodoItem({todo,hat,mode,dayStarted,onToggle,onSelect,onArchive,onToggleSub,onSelectSub,onAddSub}){
  const[exp,setExp]=useState(false);const isProj=todo.minutes>=120;const du=daysUntil(todo.dueDate);const isOver=du.includes("overdue");
  return(<div><div className={`titem ${todo.done?'done':''}`}>
    {!isProj?(<div className={`tchk ${todo.done?'on':''}`} onClick={()=>onToggle(todo.id)} style={todo.done?{}:{borderColor:hat.color+'30'}}/>):(<button className="ptog" onClick={()=>setExp(!exp)}>{exp?'▾':'▸'} {todo.subTodos.filter(s=>s.done).length}/{todo.subTodos.length}</button>)}
    <div className="tcont"><div className="ttxt">{todo.text}</div><div className="tmeta"><span className={isOver?'over':''}>{du}</span><span>{todo.minutes}m</span>{isProj&&<span className="badge b-proj">PROJECT</span>}{!isProj&&todo.selectedToday&&<span className="badge b-today">TODAY</span>}{todo.timeSpent>0&&<span className="badge b-time">{fmtMins(Math.round(todo.timeSpent/60))}</span>}{todo.done&&todo.actualTime!==null&&<span className="badge b-time">done {fmtMins(Math.round(todo.actualTime/60))}</span>}</div></div>
    <div className="tacts">{mode==='plan'&&!isProj&&!todo.done&&dayStarted&&(<button className={`sel ${todo.selectedToday?'on':''}`} onClick={()=>onSelect(todo.id)}>{todo.selectedToday?'✓ today':'+ today'}</button>)}<button className="xbtn" title="Archive" onClick={()=>onArchive(hat.id,todo.id)}>×</button></div>
  </div>{isProj&&exp&&<SubTodoList todo={todo} hatId={hat.id} mode={mode} dayStarted={dayStarted} onToggleSub={onToggleSub} onSelectSub={onSelectSub} onAddSub={onAddSub}/>}</div>);
}

function AddTodoForm({onAdd,onCancel}){
  const[t,sT]=useState("");const[m,sM]=useState("30");const[d,sD]=useState(addDays(new Date(),7));const r=useRef(null);useEffect(()=>{r.current?.focus()},[]);
  const go=()=>{if(!t.trim())return;onAdd({id:gid(),text:t.trim(),minutes:parseInt(m)||30,dueDate:d,done:false,selectedToday:false,subTodos:[],timeSpent:0,actualTime:null});sT("");sM("30");sD(addDays(new Date(),7))};
  return(<div className="aform"><input ref={r} placeholder="What needs to be done?" value={t} onChange={e=>sT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}/><div className="afrow"><input type="number" placeholder="Minutes (30)" value={m} onChange={e=>sM(e.target.value)} min="5" step="5"/><input type="date" value={d} onChange={e=>sD(e.target.value)}/></div>{parseInt(m)>=120&&<div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--purple)',marginBottom:8}}>⚡ PROJECT — add sub-tasks after</div>}<div className="fbtns"><button className="fbtn fbtn-p" onClick={go}>add</button><button className="fbtn fbtn-s" onClick={onCancel}>cancel</button></div></div>);
}

function HatCard({hat,mode,dayStarted,onToggleTodo,onSelectTodo,onArchiveTodo,onAddTodo,onToggleSub,onSelectSub,onAddSub,delay}){
  const[sf,sSf]=useState(false);
  return(<div className="hcard" style={{animationDelay:`${delay}s`}}><div className="hcard-hdr"><span className="hcard-name" style={{color:hat.color}}>{hat.name}</span><span className="hcard-cnt">{hat.todos.filter(t=>!t.done).length}</span></div>
    {hat.todos.map(t=><TodoItem key={t.id} todo={t} hat={hat} mode={mode} dayStarted={dayStarted} onToggle={id=>onToggleTodo(hat.id,id)} onSelect={id=>onSelectTodo(hat.id,id)} onArchive={onArchiveTodo} onToggleSub={onToggleSub} onSelectSub={onSelectSub} onAddSub={onAddSub}/>)}
    {sf?<AddTodoForm onAdd={t=>{onAddTodo(hat.id,t);sSf(false)}} onCancel={()=>sSf(false)}/>:<button className="addbtn" onClick={()=>sSf(true)}>+ add task</button>}</div>);
}

function WorkMode({hats,onFinishTask,onRevisitTask}){
  const todayTasks=[];
  hats.forEach(h=>{h.todos.forEach(t=>{if(t.minutes>=120){t.subTodos.filter(s=>s.selectedToday&&!s.done).forEach(s=>{todayTasks.push({...s,parentId:t.id,parentText:t.text,hatId:h.id,hatName:h.name,hatColor:h.color,dueDate:t.dueDate})})}else if(t.selectedToday&&!t.done){todayTasks.push({...t,parentId:null,parentText:null,hatId:h.id,hatName:h.name,hatColor:h.color})}})});
  const[idx,setIdx]=useState(0);const[timing,setTiming]=useState(false);const[elapsed,setElapsed]=useState(0);const timerRef=useRef(null);
  const task=todayTasks.length>0?todayTasks[idx%todayTasks.length]:null;
  useEffect(()=>{setTiming(false);setElapsed(0);if(timerRef.current)clearInterval(timerRef.current)},[idx,todayTasks.length]);
  useEffect(()=>{if(timing){timerRef.current=setInterval(()=>setElapsed(p=>p+1),1000)}else if(timerRef.current)clearInterval(timerRef.current);return()=>{if(timerRef.current)clearInterval(timerRef.current)}},[timing]);
  if(todayTasks.length===0)return<div className="wmode"><div className="nowork">// no tasks selected for today<br/>// switch to Plan → mark tasks as "today"</div></div>;
  return(<div className="wmode">
    <div className="what" style={{color:task.hatColor}}>{task.hatName}{task.parentText?` / ${task.parentText}`:''}</div>
    <div className="wtxt" key={task.id}>{task.text}</div><div className="wmeta">{task.minutes}m planned · due {fmtDate(task.dueDate)}</div>
    {task.timeSpent>0&&!timing&&elapsed===0&&<div className="timer-acc">prev: {fmtTimer(task.timeSpent)}</div>}
    <div className={`timer ${timing?'run':''}`}>{timing||elapsed>0?fmtTimer(task.timeSpent+elapsed):'—:—'}</div>
    <div className="timer-lbl">{!timing&&elapsed===0?<>ready<span className="cursor">_</span></>:timing?'running...':'paused'}</div>
    <div className="wactions">
      <button className="wact wact-start" onClick={()=>setTiming(true)} disabled={timing}>{timing?'⏱ running':'▶ start'}</button>
      <button className="wact wact-finish" onClick={()=>{if(!task)return;setTiming(false);const total=task.timeSpent+elapsed;onFinishTask(task.hatId,task.parentId,task.id,total);if(todayTasks.length>1)setIdx(p=>p%(todayTasks.length-1));setElapsed(0)}} disabled={!timing&&elapsed===0}>✓ finish</button>
      <button className="wact wact-revisit" onClick={()=>{if(!task)return;setTiming(false);onRevisitTask(task.hatId,task.parentId,task.id,elapsed);setElapsed(0);if(todayTasks.length>1){let n;do{n=Math.floor(Math.random()*todayTasks.length)}while(n===(idx%todayTasks.length));setIdx(n)}}} disabled={!timing&&elapsed===0}>↻ revisit</button>
    </div>
    <button className="shuf" onClick={()=>{if(todayTasks.length<=1||timing)return;let n;do{n=Math.floor(Math.random()*todayTasks.length)}while(n===(idx%todayTasks.length));setIdx(n)}} disabled={timing}>⟳ shuffle</button>
  </div>);
}

function TaskPicker({hats,onPick,onClose}){
  const grouped=hats.map(h=>({...h,items:h.todos.filter(t=>!t.done).flatMap(t=>{if(t.minutes>=120){return t.subTodos.filter(s=>!s.done).map(s=>({...s,parentId:t.id,parentText:t.text,isSubTask:true,dueDate:t.dueDate}))}return[{...t,parentId:null,parentText:null,isSubTask:false}]})})).filter(h=>h.items.length>0);
  if(grouped.length===0)return<div className="pkmenu"><div className="pkempty">// no pending tasks</div></div>;
  return(<div className="pkmenu" onClick={e=>e.stopPropagation()}>{grouped.map(h=>(<div key={h.id} className="pkhat"><div className="pkhn" style={{color:h.color}}>{h.name}</div>{h.items.map(t=>(<div key={t.id} className={`pktask ${t.isSubTask?'pktask-sub':''}`} onClick={()=>{onPick(h.id,t.parentId,t.id,t.isSubTask);onClose()}}><div className="dot" style={{background:h.color}}/><span>{t.isSubTask?`${t.parentText} → `:''}{t.text}</span><span className="ms">{t.minutes}m</span>{t.dueDate&&<span className="du">{daysUntil(t.dueDate)}</span>}</div>))}</div>))}</div>);
}

function WindDown({hats,onConfirm}){
  const hatTasks=hats.map(h=>{const items=[];h.todos.forEach(t=>{if(t.minutes>=120){t.subTodos.filter(s=>s.selectedToday).forEach(s=>{items.push({...s,parentText:t.text,hatId:h.id,isSubTask:true,parentId:t.id})})}else if(t.selectedToday){items.push({...t,parentText:null,hatId:h.id,isSubTask:false,parentId:null})}});return{...h,items}}).filter(h=>h.items.length>0);
  const all=hatTasks.flatMap(h=>h.items);const[checked,setChecked]=useState(new Set(all.filter(t=>t.done).map(t=>t.id)));
  const toggle=id=>{setChecked(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})};const ok=checked.size>0||all.length===0;
  return(<div className="lock"><div className="cg1"/><div className="cg2"/><div className="scanline"/><div className="lock-icon">🌙</div><div className="lock-t">// wind_down</div>
    <div className="lock-s">{all.length>0?"Check off what you completed. Be honest.":"No tasks selected today."}</div>
    <div className="ltasks">{hatTasks.map(h=>(<div key={h.id}><div className="lhat" style={{color:h.color}}>{h.name}</div>{h.items.map(t=>(<div key={t.id} className={`ltask ${checked.has(t.id)?'chk':''}`} onClick={()=>toggle(t.id)}><div className="lchk"/><div><div style={{fontSize:13}}>{t.parentText?`${t.parentText} → `:''}{t.text}</div><div className="ltask-time">{t.minutes}m{t.timeSpent>0?` · ${fmtMins(Math.round(t.timeSpent/60))} tracked`:''}</div></div></div>))}</div>))}</div>
    <button className={`ulbtn ${ok?'ok':'no'}`} onClick={()=>ok&&onConfirm([...checked])}>{ok?"that's what I did today →":"check at least 1"}</button></div>);
}

function Archives({archives}){
  const now=new Date();const d7=new Date(now);d7.setDate(d7.getDate()-7);const d30=new Date(now);d30.setDate(d30.getDate()-30);
  const l7=archives.filter(a=>new Date(a.archivedDate)>=d7);const l30=archives.filter(a=>new Date(a.archivedDate)>=d30);
  const ot7=l7.filter(a=>a.onTime).length;const ot30=l30.filter(a=>a.onTime).length;
  const p7=l7.length>0?Math.round((ot7/l7.length)*100):0;const p30=l30.length>0?Math.round((ot30/l30.length)*100):0;
  const sorted=[...archives].reverse();const overdue=sorted.filter(a=>!a.onTime);const ontime=sorted.filter(a=>a.onTime);
  const maxTime=Math.max(...archives.map(a=>Math.max(a.minutes,Math.round((a.actualTime||a.timeSpent||0)/60),1)),1);
  const card=(a,i)=>{const pl=a.minutes;const ac=a.actualTime!==null?Math.round(a.actualTime/60):(a.timeSpent>0?Math.round(a.timeSpent/60):null);const pW=Math.max((pl/maxTime)*100,4);const aW=ac!==null?Math.max((ac/maxTime)*100,4):0;
    return(<div className="acard" key={i}><div className="acard-top"><div><div className="acard-name">{a.text}</div><div className="acard-dates"><span>planned {fmtDate(a.plannedDate)}</span><span>due {fmtDate(a.dueDate)}</span><span>done {fmtDate(a.archivedDate)}</span></div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="acard-hat" style={{color:a.hatColor}}>{a.hatName}</span>{a.onTime?<span className="ob ob-ok">ON TIME</span>:<span className="ob ob-late">LATE</span>}</div></div>
      <div className="tc"><div className="tc-bars"><div className="tc-row"><span className="tc-lbl">plan</span><div className="tc-track"><div className="tc-fill" style={{width:`${pW}%`,background:'var(--amber)'}}/></div><span className="tc-val">{fmtMins(pl)}</span></div>{ac!==null&&<div className="tc-row"><span className="tc-lbl">actual</span><div className="tc-track"><div className="tc-fill" style={{width:`${aW}%`,background:ac<=pl?'var(--green)':'var(--red)'}}/></div><span className="tc-val" style={{color:ac<=pl?'var(--green)':'var(--red)'}}>{fmtMins(ac)}</span></div>}</div>{ac!==null&&<div className="tc-icon"><div className="tc-emoji">{ac<=pl?'⚡':'🐌'}</div><div className="tc-diff">{ac<=pl?`${fmtMins(pl-ac)} saved`:`${fmtMins(ac-pl)} over`}</div></div>}</div></div>)};
  return(<div className="arc"><div className="arc-scores"><div className="sc" style={{animationDelay:'0s'}}><div className="sc-big" style={{color:'var(--green)'}}>{p7}%</div><div className="sc-lbl">on-time · 7d</div><div className="sc-sub">{ot7}/{l7.length}</div></div><div className="sc" style={{animationDelay:'.1s'}}><div className="sc-big" style={{color:'var(--cyan)'}}>{p30}%</div><div className="sc-lbl">on-time · 30d</div><div className="sc-sub">{ot30}/{l30.length}</div></div><div className="sc" style={{animationDelay:'.2s'}}><div className="sc-big" style={{color:'var(--amber)'}}>{archives.length}</div><div className="sc-lbl">total archived</div></div></div>
    {archives.length===0?<div className="arc-empty">// no archived tasks yet</div>:(<>{overdue.length>0&&<><div className="arc-sec" style={{color:'var(--red)'}}>▲ deadline elapsed <span className="cnt">({overdue.length})</span></div>{overdue.map((a,i)=>card(a,'o'+i))}</>}{ontime.length>0&&<><div className="arc-sec" style={{color:'var(--green)'}}>✓ delivered on time <span className="cnt">({ontime.length})</span></div>{ontime.map((a,i)=>card(a,'g'+i))}</>}</>)}</div>);
}

// ─── Main App with Auth ───
export default function Flowlist(){
  const[authState,setAuthState]=useState('loading'); // loading | login | signup | app
  const[user,setUser]=useState(null);
  const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[displayName,setDisplayName]=useState('');
  const[authError,setAuthError]=useState('');const[authLoading,setAuthLoading]=useState(false);
  const[logoLoadFailed,setLogoLoadFailed]=useState(false);

  const[hats,setHats]=useState(DEFAULT_HATS);
  const[archives,setArchives]=useState([]);
  const[view,setView]=useState("plan");
  const[showAddHat,setShowAddHat]=useState(false);const[newHatName,setNewHatName]=useState("");
  const[dayState,setDayState]=useState("not_started");
  const[dayStartTime,setDayStartTime]=useState(null);
  const[dayDate,setDayDate]=useState(todayStr());
  const[pickerOpen,setPickerOpen]=useState(false);
  const[saveStatus,setSaveStatus]=useState('saved'); // saved | saving | error
  const saveTimer=useRef(null);
  const[loaded,setLoaded]=useState(false);

  // ─── Auth check on mount ───
  useEffect(()=>{
    const unsubscribe=onAuthStateChanged(auth,(firebaseUser)=>{
      if(firebaseUser){
        setUser(firebaseUser);
        setAuthState('app');
        loadData(firebaseUser.uid);
      } else {
        setUser(null);
        setAuthState('login');
        setHats(DEFAULT_HATS);setArchives([]);setDayState('not_started');setLoaded(false);
      }
    });
    return()=>unsubscribe();
  },[]);

  // ─── Load data ───
  async function loadData(userId){
    try{
      const data=await loadAppState(userId);
      if(data){
        if(data.hats)setHats(data.hats);
        if(data.archives)setArchives(data.archives);
        if(data.day_state)setDayState(data.day_state);
        if(data.day_start_time)setDayStartTime(data.day_start_time);
        if(data.day_date)setDayDate(data.day_date);
      }
      setLoaded(true);
    }catch(e){console.error('Load error:',e);setLoaded(true)}
  }

  // ─── Auto-save (debounced) ───
  const doSave=useCallback(async()=>{
    if(!user||!loaded)return;
    setSaveStatus('saving');
    try{
      await saveAppState(user.uid,{hats,archives,dayState,dayStartTime,dayDate});
      setSaveStatus('saved');
    }catch(e){console.error('Save error:',e);setSaveStatus('error')}
  },[user,hats,archives,dayState,dayStartTime,dayDate,loaded]);

  useEffect(()=>{
    if(!user||!loaded)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(doSave,1500);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[hats,archives,dayState,dayStartTime,dayDate,doSave]);

  // Day transitions
  useEffect(()=>{if(!user)return;const check=()=>{const today=todayStr();if(dayDate!==today&&dayState==='active'){setDayState('wind_down')}if(dayState==='locked'&&dayDate!==today){setDayState('not_started');setDayDate(today)}};check();const iv=setInterval(check,10000);return()=>clearInterval(iv)},[user,dayState,dayDate]);
  useEffect(()=>{if(!pickerOpen)return;const cl=()=>setPickerOpen(false);document.addEventListener('click',cl);return()=>document.removeEventListener('click',cl)},[pickerOpen]);

  // ─── Auth handlers ───
  async function handleSignUp(){
    setAuthError('');setAuthLoading(true);
    try{
      const userCredential=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(userCredential.user,{displayName});
      setAuthLoading(false);
    }catch(e){
      console.error('Signup error:',e);
      setAuthError(e.message||'Signup failed. Check your connection and try again.');
      setAuthLoading(false);
    }
  }
  async function handleSignIn(){
    setAuthError('');setAuthLoading(true);
    try{
      await signInWithEmailAndPassword(auth,email,password);
      setAuthLoading(false);
    }catch(e){
      console.error('Signin error:',e);
      setAuthError(e.message||'Sign in failed. Check your connection and try again.');
      setAuthLoading(false);
    }
  }
  async function handleSignOut(){await firebaseSignOut(auth)}

  // ─── Data mutations ───
  const toggleTodo=(hid,tid)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===tid?{...t,done:!t.done}:t)}:h))};
  const selectTodo=(hid,tid)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===tid?{...t,selectedToday:!t.selectedToday}:t)}:h))};
  const selectSubTodo=(hid,tid,sid)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===tid?{...t,subTodos:t.subTodos.map(s=>s.id===sid?{...s,selectedToday:!s.selectedToday}:s)}:t)}:h))};
  const archiveTodo=(hid,tid)=>{const hat=hats.find(h=>h.id===hid);const todo=hat?.todos.find(t=>t.id===tid);if(!todo)return;setArchives(p=>[...p,{text:todo.text,hatName:hat.name,hatColor:hat.color,minutes:todo.minutes,plannedDate:dayDate,dueDate:todo.dueDate,archivedDate:todayStr(),onTime:todayStr()<=todo.dueDate,timeSpent:todo.timeSpent,actualTime:todo.actualTime}]);setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.filter(t=>t.id!==tid)}:h))};
  const addTodo=(hid,todo)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:[...h.todos,todo]}:h))};
  const toggleSubTodo=(hid,tid,sid)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===tid?{...t,subTodos:t.subTodos.map(s=>s.id===sid?{...s,done:!s.done}:s)}:t)}:h))};
  const addSubTodo=(hid,tid,sub)=>{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===tid?{...t,subTodos:[...t.subTodos,sub]}:t)}:h))};
  const finishTask=(hid,parentId,taskId,totalSec)=>{setHats(p=>p.map(h=>{if(h.id!==hid)return h;return{...h,todos:h.todos.map(t=>{if(parentId&&t.id===parentId)return{...t,subTodos:t.subTodos.map(s=>s.id===taskId?{...s,done:true,timeSpent:totalSec,actualTime:totalSec}:s)};if(!parentId&&t.id===taskId)return{...t,done:true,timeSpent:totalSec,actualTime:totalSec};return t})}}))};
  const revisitTask=(hid,parentId,taskId,addedSec)=>{setHats(p=>p.map(h=>{if(h.id!==hid)return h;return{...h,todos:h.todos.map(t=>{if(parentId&&t.id===parentId)return{...t,subTodos:t.subTodos.map(s=>s.id===taskId?{...s,timeSpent:s.timeSpent+addedSec}:s)};if(!parentId&&t.id===taskId)return{...t,timeSpent:t.timeSpent+addedSec};return t})}}))};
  const addHat=()=>{if(!newHatName.trim())return;setHats(p=>[...p,{id:"hat_"+Date.now(),name:newHatName.trim().toUpperCase(),color:COLORS[p.length%COLORS.length],todos:[]}]);setNewHatName("");setShowAddHat(false)};
  const handleWindDownConfirm=(completedIds)=>{setHats(p=>p.map(h=>({...h,todos:h.todos.map(t=>{const updated=completedIds.includes(t.id)?{...t,done:true}:t;return{...updated,selectedToday:false,subTodos:updated.subTodos.map(s=>({...s,...(completedIds.includes(s.id)?{done:true}:{}),selectedToday:false}))}})})));setDayState('locked');if(todayStr()!==dayDate){setDayState('not_started');setDayDate(todayStr())}};
  const startDay=()=>{setDayStartTime(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));setDayDate(todayStr());setDayState('active');setView('plan')};
  const pickTask=(hid,parentId,taskId,isSubTask)=>{if(isSubTask&&parentId){setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===parentId?{...t,subTodos:t.subTodos.map(s=>s.id===taskId?{...s,selectedToday:true}:s)}:t)}:h))}else{setHats(p=>p.map(h=>h.id===hid?{...h,todos:h.todos.map(t=>t.id===taskId?{...t,selectedToday:true}:t)}:h))}setView('work')};

  const tCount=hats.reduce((s,h)=>s+h.todos.filter(t=>t.selectedToday&&!t.done).length+h.todos.reduce((ss,t)=>ss+t.subTodos.filter(s=>s.selectedToday&&!s.done).length,0),0);
  const tMins=hats.reduce((s,h)=>s+h.todos.filter(t=>t.selectedToday&&!t.done).reduce((m,t)=>m+t.minutes,0)+h.todos.reduce((ss,t)=>ss+t.subTodos.filter(s=>s.selectedToday&&!s.done).reduce((m,s)=>m+s.minutes,0),0),0);
  const tPend=hats.reduce((s,h)=>s+h.todos.filter(t=>!t.done).length,0);

  // ─── Render ───
  if(authState==='loading')return(<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="app"><div className="cg1"/><div className="cg2"/><div className="scanline"/><div className="auth"><div className="auth-loading">// loading...</div></div></div></>);

  if(authState==='login'||authState==='signup')return(
    <><style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="app"><div className="cg1"/><div className="cg2"/><div className="scanline"/>
      <div className="auth"><div className="auth-card">
        <div className="auth-brand">
          {!logoLoadFailed&&<img className="auth-logo-img" src={BRAND_LOGO_SRC} alt={`${BRAND_NAME} logo`} onError={()=>setLogoLoadFailed(true)}/>}
          <div className="auth-logo">{BRAND_NAME}</div>
        </div>
        <div className="auth-tag">{BRAND_TAGLINE}</div>
        {authState==='signup'&&<input className="auth-in" placeholder="your name" value={displayName} onChange={e=>setDisplayName(e.target.value)}/>}
        <input className="auth-in" placeholder="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="auth-in" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(authState==='login'?handleSignIn():handleSignUp())}/>
        {authError&&<div className="auth-err">{authError}</div>}
        <button className="auth-go" onClick={authState==='login'?handleSignIn:handleSignUp} disabled={authLoading}>
          {authLoading?'// processing...':authState==='login'?'sign in →':'create account →'}
        </button>
        <div className="auth-switch">{authState==='login'?<>new here? <button onClick={()=>{setAuthState('signup');setAuthError('')}}>create account</button></>:<>have an account? <button onClick={()=>{setAuthState('login');setAuthError('')}}>sign in</button></>}</div>
      </div></div>
    </div></>
  );

  const userName=user?.displayName||user?.email?.split('@')[0]||'user';

  if(dayState==='wind_down')return(<><style dangerouslySetInnerHTML={{ __html: CSS }} /><WindDown hats={hats} onConfirm={handleWindDownConfirm}/></>);
  if(dayState==='locked')return(<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="lock"><div className="cg1"/><div className="cg2"/><div className="scanline"/><div className="lock-icon">😴</div><div className="lock-t">// day_logged</div><div className="lock-s">Session recorded. System unlocks tomorrow.</div><button className="ulbtn ok" style={{marginTop:28}} onClick={()=>{setDayState('not_started');setDayDate(todayStr())}}>skip to morning (demo) →</button></div></>);

  const hr=new Date().getHours();const greet=hr<12?"morning":hr<17?"afternoon":"evening";

  return(<><style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="app"><div className="cg1"/><div className="cg2"/><div className="scanline"/>
      <div className="wrap">
        <div className="hdr">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div className="logo">flowlist<span>.app</span></div>
            <div className={`save-dot ${saveStatus}`} title={saveStatus==='saving'?'Saving...':saveStatus==='error'?'Save error':'Saved'}/>
          </div>
          <div className="nav">
            <div className="tabs">
              <button className={`tab ${view==='plan'?'on':''}`} onClick={()=>setView('plan')}>plan</button>
              <button className={`tab ${view==='work'?'on':''}`} onClick={()=>setView('work')} disabled={dayState!=='active'}>work</button>
              <button className={`tab ${view==='archives'?'on':''}`} onClick={()=>setView('archives')}>archives</button>
            </div>
            {dayState==='active'&&<><div className="pkwrap" onClick={e=>e.stopPropagation()}><button className="ibtn" onClick={()=>setPickerOpen(p=>!p)}>📋 pick</button>{pickerOpen&&<TaskPicker hats={hats} onPick={pickTask} onClose={()=>setPickerOpen(false)}/>}</div><button className="ibtn" onClick={()=>setDayState('wind_down')}>🌙 wind down</button></>}
            <button className="signout-btn" onClick={handleSignOut}>sign out</button>
          </div>
        </div>

        {dayState==='not_started'&&<><div className="startb"><h2>// good {greet}, {userName}</h2><p>new session awaits. initialize your day.</p><button className="gobtn" onClick={startDay}>start my day →</button></div><button className={`tab ${view==='archives'?'on':''}`} onClick={()=>setView(view==='archives'?'plan':'archives')} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,marginBottom:16}}>{view==='archives'?'hide':'view'} archives</button>{view==='archives'&&<Archives archives={archives}/>}</>}

        {dayState==='active'&&<><div className="greet">// {greet}, {userName}</div><div className="sgreet">{view==='plan'?<>plan your day.{dayStartTime&&<> started <span className="ts">{dayStartTime}</span></>}</>:view==='work'?'deep focus.':'tracked and scored.'}</div>
          {view==='plan'&&<><div className="summary"><div><div className="stn" style={{color:'var(--amber)'}}>{tCount}</div><div className="stl">today</div></div><div><div className="stn" style={{color:'var(--green)'}}>{tMins<60?`${tMins}m`:`${(tMins/60).toFixed(1)}h`}</div><div className="stl">estimated</div></div><div><div className="stn" style={{color:'var(--cyan)'}}>{tPend}</div><div className="stl">pending</div></div></div>
            <div className="hgrid">{hats.map((h,i)=><HatCard key={h.id} hat={h} mode="plan" dayStarted={true} onToggleTodo={toggleTodo} onSelectTodo={selectTodo} onArchiveTodo={archiveTodo} onAddTodo={addTodo} onToggleSub={toggleSubTodo} onSelectSub={selectSubTodo} onAddSub={addSubTodo} delay={.08+i*.08}/>)}</div>
            <div className="ahsec">{showAddHat?<div className="ahform"><input placeholder="hat name" value={newHatName} onChange={e=>setNewHatName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHat()} autoFocus/><button className="fbtn fbtn-p" onClick={addHat}>add</button><button className="fbtn fbtn-s" onClick={()=>setShowAddHat(false)}>cancel</button></div>:<button className="ahbtn" onClick={()=>setShowAddHat(true)}>+ add hat</button>}</div></>}
          {view==='work'&&<WorkMode hats={hats} onFinishTask={finishTask} onRevisitTask={revisitTask}/>}
          {view==='archives'&&<Archives archives={archives}/>}
        </>}
      </div>
    </div></>);
}
