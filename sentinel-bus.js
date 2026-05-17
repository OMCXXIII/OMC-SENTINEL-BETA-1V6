/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL BUS v1.1 - CORREÇÃO DE HANDSHAKE MOBILE
   Event Bus Central — Cognitive Modular Architecture (CMA)

   Canal único de comunicação entre domínios:
   emit / on / off / once / sticky / telemetry / replay

   FIX: Implementação de Buffer de Persistência para eventos críticos de Boot.
   UPGRADE: Arquitetura de Condução Saltatória + Domínios Cognitivos CMA
═══════════════════════════════════════════════════════════════════════════ */

const SentinelBus = (() => {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       REGISTRY INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _handlers      = Object.create(null);
    const _history       = [];
    const _sticky        = Object.create(null);
    const _domains       = Object.create(null);
    const _eventBuffer   = [];
    const _metrics       = Object.create(null);

    const MAX_HISTORY    = 200;
    const MAX_BUFFER     = 100;

    let _bootCompleted   = false;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       DOMÍNIOS COGNITIVOS (CMA)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    _domains.SYSTEM = [
        'boot:start',
        'boot:complete',
        'boot:module-ready',
        'boot:handshake',
        'nexus:command',
        'system:error',
        'system:warning'
    ];

    _domains.UI = [
        'ui:nexus-update',
        'ui:clock-tick',
        'ui:mode',
        'ui:hud-latency',
        'ui:pulse',
        'ui:overlay'
    ];

    _domains.TELEMETRY = [
        'telemetry:input',
        'telemetry:idle',
        'telemetry:activity',
        'telemetry:latency',
        'state:changed',
        'state:sync'
    ];

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOGGER INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _log = (type, event, payload) => {

        if (!SentinelBus.debug) return;

        let color = '#00FF41';

        if (type === 'emit') color = '#00D4FF';
        if (type === 'replay') color = '#FFD500';
        if (type === 'buffer') color = '#FF7A00';
        if (type === 'error') color = '#FF004C';

        console.log(
            `%c[BUS:${type.toUpperCase()}] ${event}`,
            `color:${color};font-weight:bold;font-family:monospace;`,
            payload
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       IDENTIFICAÇÃO DE DOMÍNIO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _resolveDomain = (event) => {

        for (const domain in _domains) {
            if (_domains[domain].includes(event)) {
                return domain;
            }
        }

        if (event.startsWith('ui:')) return 'UI';
        if (event.startsWith('telemetry:')) return 'TELEMETRY';
        if (event.startsWith('boot:')) return 'SYSTEM';
        if (event.startsWith('state:')) return 'TELEMETRY';

        return 'GENERIC';
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       BUFFER DE PERSISTÊNCIA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _bufferEvent = (event, payload) => {

        _eventBuffer.push({
            event,
            payload,
            ts: Date.now()
        });

        if (_eventBuffer.length > MAX_BUFFER) {
            _eventBuffer.shift();
        }

        _log('buffer', event, payload);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       FLUSH DO BUFFER APÓS BOOT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _flushBuffer = () => {

        if (!_eventBuffer.length) return;

        const pending = [..._eventBuffer];

        _eventBuffer.length = 0;

        pending.forEach(entry => {
            SentinelBus.emit(entry.event, entry.payload);
        });
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       EXECUÇÃO DE HANDLERS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _executeHandlers = (event, payload) => {

        if (!_handlers[event]) return;

        _handlers[event].forEach(handler => {

            try {
                handler(payload);

            } catch (e) {

                console.error(
                    `[BUS:ERROR] Falha no handler de ${event}:`,
                    e
                );

                SentinelBus.emit('system:error', {
                    event,
                    error: e.message,
                    stack: e.stack
                });

                _log('error', event, e);
            }
        });
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MÉTRICAS DE EVENTOS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _trackMetrics = (event) => {

        if (!_metrics[event]) {
            _metrics[event] = {
                count: 0,
                firstSeen: Date.now(),
                lastSeen: null
            };
        }

        _metrics[event].count++;
        _metrics[event].lastSeen = Date.now();
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       API PÚBLICA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    return {

        debug: true,

        version: '1.1-CMA-BUFFER',

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           EMISSÃO DE EVENTOS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        emit(event, payload = {}) {

            const domain = _resolveDomain(event);

            _trackMetrics(event);

            _log('emit', event, payload);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               EVENTOS PERSISTENTES (STICKY)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                event.includes('boot:') ||
                event.includes('state:') ||
                event.includes('telemetry:')
            ) {

                _sticky[event] = {
                    payload,
                    ts: Date.now(),
                    domain
                };
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               DETECÇÃO DE BOOT COMPLETO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (event === 'boot:complete') {

                _bootCompleted = true;

                window.SENTINEL_BOOTED = true;

                _flushBuffer();
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               BUFFERIZA EVENTOS PRÉ-BOOT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                !_bootCompleted &&
                event !== 'boot:start' &&
                event !== 'boot:complete'
            ) {

                _bufferEvent(event, payload);
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               EXECUÇÃO NORMAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _executeHandlers(event, {
                ...payload,
                __domain: domain,
                __timestamp: Date.now()
            });

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               HISTÓRICO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _history.push({
                event,
                payload,
                domain,
                ts: Date.now()
            });

            if (_history.length > MAX_HISTORY) {
                _history.shift();
            }
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           REGISTRO DE LISTENER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        on(event, handler) {

            if (!_handlers[event]) {
                _handlers[event] = [];
            }

            _handlers[event].push(handler);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               REPLAY IMEDIATO DE EVENTOS STICKY
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (_sticky[event]) {

                _log('replay', event, _sticky[event]);

                try {

                    handler({
                        ..._sticky[event].payload,
                        __replayed: true,
                        __domain: _sticky[event].domain,
                        __timestamp: _sticky[event].ts
                    });

                } catch (e) {

                    console.error(
                        `[BUS:REPLAY-ERROR] ${event}`,
                        e
                    );
                }
            }
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           LISTENER ÚNICO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        once(event, handler) {

            const wrapper = (payload) => {

                this.off(event, wrapper);

                handler(payload);
            };

            this.on(event, wrapper);
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           REMOÇÃO DE LISTENER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        off(event, handler) {

            if (!_handlers[event]) return;

            _handlers[event] = _handlers[event]
                .filter(h => h !== handler);
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           CONSULTA DE HISTÓRICO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        getHistory() {

            return [..._history];
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           CONSULTA DE EVENTOS STICKY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        hasHappened(event) {

            return !!_sticky[event];
        },

        getSticky(event) {

            return _sticky[event] || null;
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           BUFFER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        getBuffer() {

            return [..._eventBuffer];
        },

        clearBuffer() {

            _eventBuffer.length = 0;
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           MÉTRICAS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        getMetrics() {

            return JSON.parse(
                JSON.stringify(_metrics)
            );
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           DIAGNÓSTICO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        diagnostics() {

            return {

                version: this.version,

                booted: _bootCompleted,

                handlers: Object.keys(_handlers).length,

                stickyEvents: Object.keys(_sticky).length,

                bufferedEvents: _eventBuffer.length,

                historySize: _history.length,

                domains: _domains,

                metrics: this.getMetrics()
            };
        }
    };

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAPEAMENTO DE EVENTOS PADRÃO (DOCUMENTAÇÃO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * DOMÍNIO: SYSTEM (Life Cycle)
 * boot:start                 {} -> Início da sequência de carga.
 * boot:complete              {} -> Todos os sistemas prontos.
 * boot:module-ready          { module:string }
 * boot:handshake             { module:string,status:string }
 * nexus:command              { raw:string }
 * system:error               { error:string }
 * system:warning             { message:string }
 */

/**
 * DOMÍNIO: UI / DISPLAY
 * ui:nexus-update            { string:string }
 * ui:clock-tick              { time:string, elapsed:number }
 * ui:mode                    { mode:string, active:boolean }
 * ui:hud-latency             { value:string }
 * ui:pulse                   { bpm:number }
 * ui:overlay                 { active:boolean }
 */

/**
 * DOMÍNIO: TELEMETRY
 * telemetry:input            {}
 * telemetry:idle             { seconds:number }
 * telemetry:activity         { level:string }
 * telemetry:latency          { value:number }
 * state:changed              { path:string, value:any }
 * state:sync                 { snapshot:object }
 */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPOSIÇÃO GLOBAL CONTROLADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.SentinelBus = SentinelBus;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HANDSHAKE INICIAL DO SISTEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.SENTINEL_BOOTED = false;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LOG DE INICIALIZAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

console.log(
    '%c OMC SENTINEL BUS v1.1 ONLINE [BUFFER-ENABLED][CMA-READY] ',
    'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;'
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PING DE DISPONIBILIDADE GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

SentinelBus.emit('boot:start', {
    ts: Date.now(),
    mode: 'CMA',
    buffer: true,
    transport: 'saltatory'
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FALLBACK PARA NAVEGADORES SEM WEBGL
   Injeta modo 2D-ONLY quando necessário
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

(function () {
    const canvas = document.createElement('canvas');
    const hasWebGL = !!(window.WebGLRenderingContext && 
                       (canvas.getContext('webgl') || 
                        canvas.getContext('experimental-webgl')));
    
    if (!hasWebGL) {
        console.warn('%c[BUS] WebGL não disponível. Sistema em modo 2D.', 
                     'color:#FFD500;font-weight:bold;');
        SentinelBus.emit('telemetry:graphics-low', {
            reason: 'no_webgl',
            mode: '2D_FALLBACK',
            ts: Date.now()
        });
    }
})();
