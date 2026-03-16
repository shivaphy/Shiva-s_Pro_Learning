/* ═══════════════════════════════════════════
   BriskLearn — Indian Language Support
   Supports: Hindi, Marathi, Kannada, Tamil,
             Telugu, Bengali, Gujarati, Punjabi
   Uses Claude API for real-time AI translation
   ═══════════════════════════════════════════ */

window.LangService = (() => {
  const LANGUAGES = {
    en: { label: 'English', script: 'Latin', native: 'English' },
    hi: { label: 'Hindi', script: 'Devanagari', native: 'हिंदी' },
    mr: { label: 'Marathi', script: 'Devanagari', native: 'मराठी' },
    kn: { label: 'Kannada', script: 'Kannada', native: 'ಕನ್ನಡ' },
    ta: { label: 'Tamil', script: 'Tamil', native: 'தமிழ்' },
    te: { label: 'Telugu', script: 'Telugu', native: 'తెలుగు' },
    bn: { label: 'Bengali', script: 'Bengali', native: 'বাংলা' },
    gu: { label: 'Gujarati', script: 'Gujarati', native: 'ગુજરાતી' },
    pa: { label: 'Punjabi', script: 'Gurmukhi', native: 'ਪੰਜਾਬੀ' },
  };

  let currentLang = localStorage.getItem('bl_lang') || 'en';

  function getCurrentLang() { return currentLang; }
  function getLanguages() { return LANGUAGES; }

  function setLang(code) {
    currentLang = code;
    localStorage.setItem('bl_lang', code);
    document.body.className = document.body.className.replace(/lang-\w+/g, '');
    if (code !== 'en') document.body.classList.add('lang-' + code);
  }

  /**
   * Translate text to selected Indian language using Claude API
   */
  async function translate(text, targetLang) {
    if (targetLang === 'en' || !text?.trim()) return text;
    const lang = LANGUAGES[targetLang];
    if (!lang) return text;

    const prompt = `Translate the following educational text to ${lang.label} (${lang.native}). 
Preserve formatting, newlines, and structure. Only return the translated text, nothing else.

Text to translate:
${text}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      return data.content?.map(b => b.text || '').join('') || text;
    } catch (err) {
      console.error('[LangService] Translation error:', err);
      return text;
    }
  }

  /**
   * Render the language selector UI into a container
   */
  function renderSelector(containerId, onChangeCb) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="margin-bottom:6px;font-size:12px;font-weight:600;color:var(--muted)">Content Language</div>
      <div class="lang-selector" id="lang-pills">
        ${Object.entries(LANGUAGES).map(([code, info]) => `
          <button class="lang-pill ${code === currentLang ? 'active' : ''}"
            onclick="LangService._selectLang('${code}', this)"
            title="${info.label}">
            ${info.native}
          </button>
        `).join('')}
      </div>
    `;
    window._langChangeCb = onChangeCb;
  }

  function _selectLang(code, btn) {
    setLang(code);
    document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    if (typeof window._langChangeCb === 'function') window._langChangeCb(code);
  }

  /**
   * Translate and inject AI-generated content
   */
  async function translateOutput(elementId, text, lang) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (lang === 'en') { el.textContent = text; return; }

    el.innerHTML = `<div class="ai-thinking"><div class="dot-spin"><span></span><span></span><span></span></div> Translating to ${LANGUAGES[lang]?.native || lang}...</div>`;
    const translated = await translate(text, lang);
    el.textContent = translated;
  }

  return {
    getCurrentLang, getLanguages, setLang, translate,
    renderSelector, translateOutput, _selectLang
  };
})();
