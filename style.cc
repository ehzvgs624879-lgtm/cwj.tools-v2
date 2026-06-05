:root {
  --bg-dark: #09090b;
  --bg-surface: rgba(24, 24, 27, 0.6);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-main: #f4f4f5;
  --text-muted: #a1a1aa;
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
  --accent-gradient: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 25px -3px rgba(0, 0, 0, 0.8);
  --blur-effect: blur(16px);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
body {
  background-color: var(--bg-dark); color: var(--text-main); height: 100vh; overflow: hidden;
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(96, 165, 250, 0.05), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(167, 139, 250, 0.05), transparent 25%);
}
.glass-panel { background: var(--bg-surface); backdrop-filter: var(--blur-effect); -webkit-backdrop-filter: var(--blur-effect); border: 1px solid var(--border-color); border-radius: 12px; }
.gradient-text { background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
.app-container { display: flex; height: 100vh; }
.sidebar { width: 260px; margin: 16px; padding: 24px 16px; display: flex; flex-direction: column; }
.logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; margin-bottom: 40px; padding: 0 12px; }
.logo i { color: #60a5fa; }
.nav-menu { display: flex; flex-direction: column; gap: 6px; }
.nav-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin: 16px 0 8px 12px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; color: var(--text-muted); text-decoration: none; font-size: 14px; transition: var(--transition); }
.nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }
.nav-item.active { background: rgba(255,255,255,0.08); color: var(--text-main); border-left: 3px solid #60a5fa; }
.main-content { flex: 1; display: flex; flex-direction: column; padding: 16px 16px 16px 0; overflow: hidden; }
.top-header { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; margin-bottom: 16px; border-radius: 12px; }
.search-bar { display: flex; align-items: center; gap: 12px; flex: 1; }
.search-bar i { color: var(--text-muted); width: 18px; }
.search-bar input { background: transparent; border: none; outline: none; color: var(--text-main); font-size: 14px; width: 100%; max-width: 400px; }
.user-profile .avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.view-container { flex: 1; overflow-y: auto; position: relative; }
.view { display: none; height: 100%; animation: fadeIn 0.3s ease-out; }
.view.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.view-header { margin-bottom: 32px; padding: 0 12px; }
.view-header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 600; }
.view-header p { color: var(--text-muted); font-size: 15px; }
.tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.tool-card { padding: 24px; cursor: pointer; transition: var(--transition); display: flex; flex-direction: column; gap: 16px; }
.tool-card:hover { transform: translateY(-4px); border-color: rgba(255, 255, 255, 0.2); box-shadow: var(--shadow-lg); background: rgba(255,255,255,0.03); }
.card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.tool-card h3 { font-size: 16px; font-weight: 500; }
.tool-card p { font-size: 13px; color: var(--text-muted); line-height: 1.5; flex: 1; }
textarea { width: 100%; flex: 1; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main); padding: 16px; font-size: 14px; resize: none; outline: none; transition: var(--transition); }
textarea:focus { border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96,165,250,0.2); }
button { cursor: pointer; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background: var(--accent-color); color: white; padding: 10px 20px; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-secondary { background: rgba(255,255,255,0.1); color: var(--text-main); padding: 10px 16px; }
.btn-secondary:hover { background: rgba(255,255,255,0.15); }
.chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); }
.chat-messages { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
.message { display: flex; gap: 16px; max-width: 80%; }
.message.ai-message { align-self: flex-start; }
.message.user-message { align-self: flex-end; flex-direction: row-reverse; }
.message .avatar { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-message .avatar { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.user-message .avatar { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.message .content { background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 12px; font-size: 14px; line-height: 1.6; border: 1px solid var(--border-color); }
.chat-input-area { padding: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 12px; background: rgba(0,0,0,0.2); }
.chat-input-area textarea { height: 50px; padding: 14px; }
.tool-layout { display: flex; gap: 16px; height: calc(100vh - 120px); }
.input-panel, .output-panel { flex: 1; display: flex; flex-direction: column; padding: 20px; gap: 16px; }
.input-panel h3, .output-panel h3 { font-size: 15px; font-weight: 500; color: var(--text-muted); }
.action-buttons { display: flex; gap: 12px; }
.result-box { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; font-size: 14px; color: var(--text-main); overflow-y: auto; white-space: pre-wrap; line-height: 1.6; }
.calc-container { width: 100%; max-width: 380px; margin: 40px auto; padding: 24px; border-radius: 20px; }
.calc-display { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 24px; text-align: right; font-size: 40px; font-weight: 300; margin-bottom: 24px; overflow-x: auto; letter-spacing: 2px; }
.calc-keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.calc-btn { aspect-ratio: 1; font-size: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; }
.calc-btn:hover { background: rgba(255,255,255,0.1); }
.calc-btn.operator { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.calc-btn.utility { background: rgba(255,255,255,0.02); color: var(--text-muted); }
.calc-btn.zero { grid-column: span 2; aspect-ratio: auto; }
.calc-btn.equals { background: var(--accent-gradient); color: white; }
@media (max-width: 768px) {
  .app-container { flex-direction: column; }
  .sidebar { width: auto; margin: 0; padding: 16px; border-radius: 0; border-bottom: 1px solid var(--border-color); flex-direction: row; align-items: center; justify-content: space-between; height: 70px; }
  .logo { margin-bottom: 0; } .nav-menu { display: none; } .main-content { padding: 16px; }
  .tool-layout { flex-direction: column; height: auto; } .input-panel, .output-panel { height: 400px; }
}
