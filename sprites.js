// ============================================================================
// 1945 Flying Tigers — sprite assets + loader (visual redesign, 2026-09)
// Top-down cel-shaded SVG sprites. Loaded once into Image objects; a white
// "flash" silhouette of every sprite is pre-rendered for hit feedback.
// Load this file BEFORE game.js.
// ============================================================================
const SPRITE_SIZES = {"player_p38": [64, 64], "enemy_zero": [48, 48], "enemy_ki61": [52, 52], "enemy_g4m": [96, 72], "boss_heavy": [200, 130], "boss_body": [200, 130], "bullet_player": [10, 24], "bullet_enemy": [16, 16], "bullet_enemy_pink": [16, 16], "explosion_1": [48, 48], "explosion_2": [48, 48], "explosion_3": [48, 48], "explosion_4": [48, 48], "powerup_P": [28, 28], "powerup_B": [28, 28], "bomb_icon": [14, 18], "life_icon": [18, 16]};
const SPRITES = {
 "player_p38": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><g id=\"L\"><rect x=\"12.5\" y=\"10\" width=\"8\" height=\"46\" rx=\"4\" fill=\"#C9A75B\" stroke=\"#22200f\" stroke-width=\"1.2\"/><rect x=\"13.5\" y=\"12\" width=\"3\" height=\"40\" rx=\"1.5\" fill=\"#EBD08A\" opacity=\".7\"/><path d=\"M12 12 Q16.5 3 21 12 L21 28 L12 28 Z\" fill=\"#C9A75B\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M13.5 13 Q16.5 7 19.5 13 L19.5 24 L13.5 24 Z\" fill=\"#EBD08A\" opacity=\".55\"/><rect x=\"11\" y=\"16\" width=\"2\" height=\"6\" fill=\"#9C7B36\"/><ellipse cx=\"16.5\" cy=\"6\" rx=\"10\" ry=\"2.4\" fill=\"#111\" opacity=\".28\"/><ellipse cx=\"16.5\" cy=\"6\" rx=\"10\" ry=\"1.2\" fill=\"#fff\" opacity=\".35\"/><circle cx=\"16.5\" cy=\"6.5\" r=\"2.4\" fill=\"#D8352B\" stroke=\"#22200f\" stroke-width=\"1\"/><ellipse cx=\"16.5\" cy=\"55\" rx=\"4.5\" ry=\"6.5\" fill=\"#9C7B36\" stroke=\"#22200f\" stroke-width=\"1.2\"/><ellipse cx=\"16.5\" cy=\"55\" rx=\"2.2\" ry=\"4.5\" fill=\"#C9A75B\"/><path d=\"M32 26 L3 29 Q1 31.5 3 35 L32 41 Z\" fill=\"#C9A75B\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M30 27.5 L6 30 L6 31.5 L30 33 Z\" fill=\"#EBD08A\" opacity=\".6\"/><path d=\"M32 37.5 L8 34.5 L32 41 Z\" fill=\"#9C7B36\" opacity=\".8\"/><circle cx=\"8.5\" cy=\"32.5\" r=\"3.4\" fill=\"#2B4F9E\" stroke=\"#22200f\" stroke-width=\".8\"/><polygon points=\"8.5,29.9 9.3,31.7 11.2,31.8 9.7,33 10.2,34.9 8.5,33.8 6.8,34.9 7.3,33 5.8,31.8 7.7,31.7\" fill=\"#FFFFFF\"/><rect x=\"16.5\" y=\"51\" width=\"15.5\" height=\"4.5\" rx=\"1.5\" fill=\"#C9A75B\" stroke=\"#22200f\" stroke-width=\"1.2\"/></g><use href=\"#L\" transform=\"translate(64,0) scale(-1,1)\"/><path d=\"M27 40 L27 18 Q32 8 37 18 L37 40 Q32 44 27 40 Z\" fill=\"#C9A75B\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M29 22 Q32 16 35 22 L35 30 Q32 33 29 30 Z\" fill=\"#4E9BD6\" stroke=\"#22200f\" stroke-width=\"1\"/><path d=\"M30 22 Q32 18 34 22 L34 25 Q32 27 30 25 Z\" fill=\"#BFE4FF\" opacity=\".85\"/><rect x=\"30.5\" y=\"12\" width=\"3\" height=\"5\" rx=\"1\" fill=\"#555\" stroke=\"#22200f\" stroke-width=\".8\"/><rect x=\"29\" y=\"33\" width=\"6\" height=\"7\" rx=\"1\" fill=\"#9C7B36\" opacity=\".6\"/></svg>",
 "enemy_zero": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"48\" height=\"48\" viewBox=\"0 0 48 48\"><g id=\"L\"><path d=\"M24 17 L3 22 Q1 24 3 27 L24 31 Z\" fill=\"#3F6B3E\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M23 19 L6 23 L6 24 L23 25 Z\" fill=\"#6F9C64\" opacity=\".55\"/><path d=\"M24 28 L7 26 L24 31 Z\" fill=\"#2A4A2B\"/><circle cx=\"10\" cy=\"24.5\" r=\"3.4\" fill=\"#fff\" stroke=\"#22200f\" stroke-width=\".7\"/><circle cx=\"10\" cy=\"24.5\" r=\"2.4\" fill=\"#D42A2A\"/><path d=\"M24 37 L13 39 Q12 40.5 13 42 L24 43 Z\" fill=\"#3F6B3E\" stroke=\"#22200f\" stroke-width=\"1.1\"/></g><use href=\"#L\" transform=\"translate(48,0) scale(-1,1)\"/><path d=\"M20 44 L20 13 Q24 3 28 13 L28 44 Q24 47 20 44 Z\" fill=\"#3F6B3E\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M21.5 14 Q24 9 26.5 14 L26.5 40 Q24 42 21.5 40 Z\" fill=\"#6F9C64\" opacity=\".35\"/><circle cx=\"24\" cy=\"9.5\" r=\"4.6\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"24\" cy=\"9.5\" r=\"2.2\" fill=\"#5A5F66\"/><ellipse cx=\"24\" cy=\"5\" rx=\"9\" ry=\"2\" fill=\"#111\" opacity=\".3\"/><path d=\"M21.5 18 Q24 15 26.5 18 L26.5 26 Q24 28 21.5 26 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><path d=\"M22.5 18.5 Q24 16.5 25.5 18.5 L25.5 21 L22.5 21 Z\" fill=\"#DDF3FF\" opacity=\".9\"/><path d=\"M22 44 L24 34 L26 44 Z\" fill=\"#2A4A2B\" stroke=\"#22200f\" stroke-width=\".9\"/></svg>",
 "enemy_ki61": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"52\" height=\"52\" viewBox=\"0 0 52 52\"><g id=\"L\"><path d=\"M26 20 L4 24 Q2 26 4 29 L26 33 Z\" fill=\"#8A9488\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M25 22 L7 25 L7 26 L25 27 Z\" fill=\"#C2CBC0\" opacity=\".6\"/><path d=\"M26 30 L8 28 L26 33 Z\" fill=\"#5E685E\"/><circle cx=\"11\" cy=\"26.5\" r=\"3.2\" fill=\"#fff\" stroke=\"#22200f\" stroke-width=\".7\"/><circle cx=\"11\" cy=\"26.5\" r=\"2.2\" fill=\"#D42A2A\"/><path d=\"M26 41 L16 43 Q15 44.5 16 46 L26 47 Z\" fill=\"#8A9488\" stroke=\"#22200f\" stroke-width=\"1.1\"/></g><use href=\"#L\" transform=\"translate(52,0) scale(-1,1)\"/><path d=\"M23 48 L23 12 Q26 2 29 12 L29 48 Q26 50 23 48 Z\" fill=\"#8A9488\" stroke=\"#22200f\" stroke-width=\"1.2\"/><path d=\"M24.2 13 Q26 6 27.8 13 L27.8 44 Q26 46 24.2 44 Z\" fill=\"#C2CBC0\" opacity=\".4\"/><rect x=\"24.5\" y=\"2\" width=\"3\" height=\"4\" rx=\"1\" fill=\"#444\" stroke=\"#22200f\" stroke-width=\".8\"/><ellipse cx=\"26\" cy=\"3.5\" rx=\"8\" ry=\"1.6\" fill=\"#111\" opacity=\".3\"/><path d=\"M24 20 Q26 17 28 20 L28 28 Q26 30 24 28 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><path d=\"M24.7 20.5 Q26 18.5 27.3 20.5 L27.3 23 L24.7 23 Z\" fill=\"#DDF3FF\" opacity=\".9\"/><path d=\"M24.5 48 L26 38 L27.5 48 Z\" fill=\"#5E685E\" stroke=\"#22200f\" stroke-width=\".9\"/><rect x=\"21\" y=\"30\" width=\"2\" height=\"5\" fill=\"#D42A2A\"/><rect x=\"29\" y=\"30\" width=\"2\" height=\"5\" fill=\"#D42A2A\"/></svg>",
 "enemy_g4m": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"96\" height=\"72\" viewBox=\"0 0 96 72\"><g id=\"L\"><path d=\"M48 26 L4 33 Q2 35.5 4 38 L48 44 Z\" fill=\"#5B7A4A\" stroke=\"#22200f\" stroke-width=\"1.3\"/><path d=\"M46 28 L8 34 L8 35.5 L46 36 Z\" fill=\"#8DAA76\" opacity=\".55\"/><path d=\"M48 40 L10 37 L48 44 Z\" fill=\"#3B5231\"/><rect x=\"17\" y=\"18\" width=\"12\" height=\"26\" rx=\"5\" fill=\"#5B7A4A\" stroke=\"#22200f\" stroke-width=\"1.2\"/><rect x=\"19\" y=\"20\" width=\"4\" height=\"20\" rx=\"2\" fill=\"#8DAA76\" opacity=\".6\"/><circle cx=\"23\" cy=\"18\" r=\"5\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"23\" cy=\"18\" r=\"2\" fill=\"#666\"/><ellipse cx=\"23\" cy=\"13.5\" rx=\"11\" ry=\"2.2\" fill=\"#111\" opacity=\".3\"/><circle cx=\"10\" cy=\"35.5\" r=\"4\" fill=\"#fff\" stroke=\"#22200f\" stroke-width=\".8\"/><circle cx=\"10\" cy=\"35.5\" r=\"2.8\" fill=\"#D42A2A\"/><path d=\"M48 58 L30 61 Q28.5 63 30 65 L48 67 Z\" fill=\"#5B7A4A\" stroke=\"#22200f\" stroke-width=\"1.2\"/></g><use href=\"#L\" transform=\"translate(96,0) scale(-1,1)\"/><path d=\"M42 66 L42 14 Q48 2 54 14 L54 66 Q48 72 42 66 Z\" fill=\"#5B7A4A\" stroke=\"#22200f\" stroke-width=\"1.3\"/><path d=\"M44 15 Q48 7 52 15 L52 62 Q48 66 44 62 Z\" fill=\"#8DAA76\" opacity=\".35\"/><path d=\"M44.5 9 Q48 4 51.5 9 L51.5 14 L44.5 14 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><path d=\"M44.5 20 Q48 17 51.5 20 L51.5 27 L44.5 27 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><path d=\"M45 66 L48 52 L51 66 Z\" fill=\"#3B5231\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"48\" cy=\"60\" r=\"3\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\".8\"/></svg>",
 "boss_heavy": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"200\" height=\"130\" viewBox=\"0 0 200 130\"><g id=\"L\"><path d=\"M100 48 L6 62 Q2 66 6 70 L100 82 Z\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.6\"/><path d=\"M96 51 L12 63 L12 65 L96 66 Z\" fill=\"#7E8791\" opacity=\".5\"/><path d=\"M100 76 L14 68 L100 82 Z\" fill=\"#2E3237\"/><rect x=\"14\" y=\"60\" width=\"8\" height=\"12\" fill=\"#C8302B\" opacity=\".9\"/><rect x=\"26\" y=\"36\" width=\"15\" height=\"42\" rx=\"6\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.4\"/><rect x=\"29\" y=\"40\" width=\"4\" height=\"30\" rx=\"2\" fill=\"#7E8791\" opacity=\".5\"/><circle cx=\"33.5\" cy=\"36\" r=\"6.5\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\"1.1\"/><circle cx=\"33.5\" cy=\"36\" r=\"2.4\" fill=\"#777\"/><ellipse cx=\"33.5\" cy=\"30\" rx=\"14\" ry=\"2.6\" fill=\"#111\" opacity=\".3\"/><rect x=\"58\" y=\"34\" width=\"15\" height=\"44\" rx=\"6\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.4\"/><rect x=\"61\" y=\"38\" width=\"4\" height=\"30\" rx=\"2\" fill=\"#7E8791\" opacity=\".5\"/><circle cx=\"65.5\" cy=\"34\" r=\"6.5\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\"1.1\"/><circle cx=\"65.5\" cy=\"34\" r=\"2.4\" fill=\"#777\"/><ellipse cx=\"65.5\" cy=\"28\" rx=\"14\" ry=\"2.6\" fill=\"#111\" opacity=\".3\"/><path d=\"M100 104 L64 110 Q61 113 64 116 L100 120 Z\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.4\"/><circle cx=\"48\" cy=\"66\" r=\"5\" fill=\"#2E3237\" stroke=\"#22200f\" stroke-width=\"1\"/><rect x=\"47\" y=\"56\" width=\"2\" height=\"8\" fill=\"#111\"/></g><use href=\"#L\" transform=\"translate(200,0) scale(-1,1)\"/><path d=\"M89 118 L89 24 Q100 4 111 24 L111 118 Q100 128 89 118 Z\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.6\"/><path d=\"M92 26 Q100 12 108 26 L108 112 Q100 118 92 112 Z\" fill=\"#7E8791\" opacity=\".3\"/><rect x=\"89\" y=\"88\" width=\"22\" height=\"10\" fill=\"#C8302B\" opacity=\".9\"/><path d=\"M93 14 Q100 6 107 14 L107 22 L93 22 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\"1\"/><path d=\"M94.5 15 Q100 10 105.5 15 L105.5 18 L94.5 18 Z\" fill=\"#DDF3FF\" opacity=\".9\"/><rect x=\"94\" y=\"30\" width=\"12\" height=\"8\" rx=\"2\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><circle cx=\"100\" cy=\"50\" r=\"6\" fill=\"#2E3237\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"100\" cy=\"50\" r=\"2.5\" fill=\"#D42A2A\"/><path d=\"M95 118 L100 96 L105 118 Z\" fill=\"#2E3237\" stroke=\"#22200f\" stroke-width=\"1.2\"/><circle cx=\"100\" cy=\"110\" r=\"4\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\".9\"/></svg>",
 "boss_body": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"200\" height=\"130\" viewBox=\"0 0 200 130\"><path d=\"M89 118 L89 24 Q100 4 111 24 L111 118 Q100 128 89 118 Z\" fill=\"#4B5158\" stroke=\"#22200f\" stroke-width=\"1.6\"/><path d=\"M92 26 Q100 12 108 26 L108 112 Q100 118 92 112 Z\" fill=\"#7E8791\" opacity=\".3\"/><rect x=\"89\" y=\"88\" width=\"22\" height=\"10\" fill=\"#C8302B\" opacity=\".9\"/><path d=\"M93 14 Q100 6 107 14 L107 22 L93 22 Z\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\"1\"/><path d=\"M94.5 15 Q100 10 105.5 15 L105.5 18 L94.5 18 Z\" fill=\"#DDF3FF\" opacity=\".9\"/><rect x=\"94\" y=\"30\" width=\"12\" height=\"8\" rx=\"2\" fill=\"#7FC3F0\" stroke=\"#22200f\" stroke-width=\".9\"/><circle cx=\"100\" cy=\"50\" r=\"6\" fill=\"#2E3237\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"100\" cy=\"50\" r=\"2.5\" fill=\"#D42A2A\"/><path d=\"M95 118 L100 96 L105 118 Z\" fill=\"#2E3237\" stroke=\"#22200f\" stroke-width=\"1.2\"/><circle cx=\"100\" cy=\"110\" r=\"4\" fill=\"#1C1F22\" stroke=\"#22200f\" stroke-width=\".9\"/></svg>",
 "bullet_player": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"10\" height=\"24\" viewBox=\"0 0 10 24\"><ellipse cx=\"5\" cy=\"12\" rx=\"5\" ry=\"12\" fill=\"#FFB400\" opacity=\".28\"/><path d=\"M5 1 Q8.5 8 8 20 Q5 24 2 20 Q1.5 8 5 1 Z\" fill=\"#FFCE3A\" stroke=\"#B85A00\" stroke-width=\".8\"/><path d=\"M5 4 Q6.4 9 6.2 17 Q5 19 3.8 17 Q3.6 9 5 4 Z\" fill=\"#FFF7D0\"/></svg>",
 "bullet_enemy": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"8\" fill=\"#FF3B1F\" opacity=\".25\"/><circle cx=\"8\" cy=\"8\" r=\"5.6\" fill=\"#FF5A1F\" stroke=\"#7A1500\" stroke-width=\"1\"/><circle cx=\"8\" cy=\"8\" r=\"3\" fill=\"#FFE68A\"/><circle cx=\"7\" cy=\"7\" r=\"1.4\" fill=\"#fff\"/></svg>",
 "bullet_enemy_pink": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"8\" fill=\"#FF2D9E\" opacity=\".25\"/><circle cx=\"8\" cy=\"8\" r=\"5.6\" fill=\"#FF3FAE\" stroke=\"#7A0A4A\" stroke-width=\"1\"/><circle cx=\"8\" cy=\"8\" r=\"3\" fill=\"#FFD6F0\"/><circle cx=\"7\" cy=\"7\" r=\"1.4\" fill=\"#fff\"/></svg>",
 "explosion_1": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"48\" height=\"48\" viewBox=\"0 0 48 48\"><polygon points=\"24,2 28,18 44,14 32,24 44,34 28,30 24,46 20,30 4,34 16,24 4,14 20,18\" fill=\"#FFF3B0\" stroke=\"#FF8A00\" stroke-width=\"1.2\"/><circle cx=\"24\" cy=\"24\" r=\"7\" fill=\"#fff\"/></svg>",
 "explosion_2": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"48\" height=\"48\" viewBox=\"0 0 48 48\"><circle cx=\"24\" cy=\"24\" r=\"21\" fill=\"#FF6A00\" opacity=\".55\"/><path d=\"M24 5 Q34 8 38 16 Q46 22 40 32 Q38 42 26 43 Q14 44 10 34 Q4 26 10 16 Q14 7 24 5 Z\" fill=\"#FF7A1A\" stroke=\"#8A2A00\" stroke-width=\"1.2\"/><path d=\"M24 12 Q31 14 33 21 Q37 27 31 32 Q26 36 19 33 Q13 28 15 21 Q17 14 24 12 Z\" fill=\"#FFC021\"/><circle cx=\"23\" cy=\"22\" r=\"5\" fill=\"#FFF6C8\"/></svg>",
 "explosion_3": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"48\" height=\"48\" viewBox=\"0 0 48 48\"><circle cx=\"24\" cy=\"24\" r=\"23\" fill=\"none\" stroke=\"#FFB347\" stroke-width=\"2\" opacity=\".8\"/><circle cx=\"12\" cy=\"18\" r=\"8\" fill=\"#3A3A3A\" opacity=\".8\"/><circle cx=\"34\" cy=\"14\" r=\"7\" fill=\"#4A4A4A\" opacity=\".8\"/><circle cx=\"36\" cy=\"32\" r=\"8\" fill=\"#333\" opacity=\".8\"/><circle cx=\"16\" cy=\"34\" r=\"7\" fill=\"#444\" opacity=\".8\"/><path d=\"M24 14 Q30 16 31 22 Q34 28 27 31 Q22 33 18 29 Q14 23 18 18 Q20 14 24 14 Z\" fill=\"#E8471C\" stroke=\"#6E1A00\" stroke-width=\"1\"/><circle cx=\"24\" cy=\"23\" r=\"4\" fill=\"#FFB347\"/><rect x=\"6\" y=\"8\" width=\"3\" height=\"3\" fill=\"#FFD25A\" transform=\"rotate(20 7 9)\"/><rect x=\"38\" y=\"38\" width=\"3\" height=\"3\" fill=\"#FFD25A\" transform=\"rotate(35 39 39)\"/><rect x=\"40\" y=\"6\" width=\"2.5\" height=\"2.5\" fill=\"#FFD25A\"/></svg>",
 "explosion_4": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"48\" height=\"48\" viewBox=\"0 0 48 48\"><circle cx=\"14\" cy=\"20\" r=\"9\" fill=\"#6B6B6B\" opacity=\".45\"/><circle cx=\"32\" cy=\"16\" r=\"8\" fill=\"#777\" opacity=\".4\"/><circle cx=\"34\" cy=\"32\" r=\"9\" fill=\"#666\" opacity=\".4\"/><circle cx=\"17\" cy=\"34\" r=\"8\" fill=\"#707070\" opacity=\".4\"/><circle cx=\"24\" cy=\"24\" r=\"6\" fill=\"#888\" opacity=\".35\"/></svg>",
 "powerup_P": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"28\" height=\"28\" viewBox=\"0 0 28 28\"><circle cx=\"14\" cy=\"14\" r=\"13\" fill=\"#E2402A\" stroke=\"#22200f\" stroke-width=\"1.4\"/><circle cx=\"14\" cy=\"14\" r=\"9.5\" fill=\"#fff\"/><text x=\"14\" y=\"18.6\" text-anchor=\"middle\" font-family=\"'Press Start 2P', monospace\" font-size=\"11\" fill=\"#E2402A\" font-weight=\"700\">P</text></svg>",
 "powerup_B": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"28\" height=\"28\" viewBox=\"0 0 28 28\"><circle cx=\"14\" cy=\"14\" r=\"13\" fill=\"#2E6FD8\" stroke=\"#22200f\" stroke-width=\"1.4\"/><circle cx=\"14\" cy=\"14\" r=\"9.5\" fill=\"#fff\"/><text x=\"14\" y=\"18.6\" text-anchor=\"middle\" font-family=\"'Press Start 2P', monospace\" font-size=\"11\" fill=\"#2E6FD8\" font-weight=\"700\">B</text></svg>",
 "bomb_icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"14\" height=\"18\" viewBox=\"0 0 14 18\"><rect x=\"5.5\" y=\"1\" width=\"3\" height=\"4\" fill=\"#9AA0A6\" stroke=\"#22200f\" stroke-width=\".8\"/><circle cx=\"7\" cy=\"11\" r=\"6\" fill=\"#2B2F35\" stroke=\"#22200f\" stroke-width=\"1\"/><circle cx=\"5\" cy=\"9\" r=\"1.8\" fill=\"#8D97A3\" opacity=\".8\"/></svg>",
 "life_icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"18\" height=\"16\" viewBox=\"0 0 18 16\"><g fill=\"#F2D27A\" stroke=\"#22200f\" stroke-width=\".7\"><rect x=\"3\" y=\"2\" width=\"3\" height=\"12\" rx=\"1.2\"/><rect x=\"12\" y=\"2\" width=\"3\" height=\"12\" rx=\"1.2\"/><path d=\"M7.5 11 L7.5 4 Q9 1.5 10.5 4 L10.5 11 Z\"/><path d=\"M0.5 7 L17.5 7 L17.5 9.5 L0.5 9.5 Z\"/><rect x=\"4\" y=\"12\" width=\"10\" height=\"1.6\"/></g></svg>"
};

const SPR = {
    ready: false,
    img: {},      // name -> HTMLImageElement
    flash: {},    // name -> offscreen canvas (white silhouette)
    shadow: {},   // name -> offscreen canvas (black silhouette)
    load(onDone) {
        const names = Object.keys(SPRITES);
        let pending = names.length;
        const finish = () => {
            if (--pending > 0) return;
            // pre-render flash / shadow silhouettes at 2x for crisp downscaling
            for (const n of names) {
                const img = SPR.img[n];
                if (!img || !img.width) continue;
                const [w, h] = SPRITE_SIZES[n];
                for (const kind of ['flash', 'shadow']) {
                    const c = document.createElement('canvas');
                    c.width = w * 2; c.height = h * 2;
                    const g = c.getContext('2d');
                    g.drawImage(img, 0, 0, w * 2, h * 2);
                    g.globalCompositeOperation = 'source-in';
                    g.fillStyle = kind === 'flash' ? '#FFFFFF' : '#000000';
                    g.fillRect(0, 0, c.width, c.height);
                    SPR[kind][n] = c;
                }
            }
            SPR.ready = true;
            if (onDone) onDone();
        };
        for (const n of names) {
            const img = new Image();
            img.onload = finish;
            img.onerror = () => { console.error('sprite failed: ' + n); finish(); };
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SPRITES[n]);
            SPR.img[n] = img;
        }
    }
};

// Draw a sprite centered at (cx, cy). `w` = target width in px (height keeps
// the sprite's aspect). angle in radians (0 = nose up). alpha 0..1.
// flash: 0..1 blends a white silhouette on top (hit feedback).
function drawSprite(ctx, name, cx, cy, w, angle, alpha, flash) {
    const img = SPR.img[name];
    if (!img || !SPR.ready) return false;
    const sz = SPRITE_SIZES[name];
    const s = w / sz[0];
    const h = sz[1] * s;
    ctx.save();
    if (alpha !== undefined && alpha < 1) ctx.globalAlpha *= Math.max(0, alpha);
    ctx.translate(cx, cy);
    if (angle) ctx.rotate(angle);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (flash && flash > 0) {
        const f = SPR.flash[name];
        if (f) { ctx.globalAlpha *= Math.min(1, flash); ctx.drawImage(f, -w / 2, -h / 2, w, h); }
    }
    ctx.restore();
    return true;
}

// Altitude shadow: black silhouette, offset and soft.
function drawSpriteShadow(ctx, name, cx, cy, w, angle, alpha) {
    const c = SPR.shadow[name];
    if (!c || !SPR.ready) return;
    const sz = SPRITE_SIZES[name];
    const s = w / sz[0];
    const h = sz[1] * s;
    ctx.save();
    ctx.globalAlpha *= (alpha === undefined ? 0.28 : alpha);
    ctx.translate(cx + 14, cy + 22);
    if (angle) ctx.rotate(angle);
    ctx.drawImage(c, -w / 2, -h / 2, w, h);
    ctx.restore();
}
