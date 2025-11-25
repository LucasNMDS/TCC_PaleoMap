import os
import time
import requests
import json # Importa a biblioteca para manipulação de JSON
from datetime import datetime, timedelta # Importa bibliotecas para lidar com o tempo
from flask import Flask, render_template, jsonify

# --- Configurações ---
GITHUB_REPO_OWNER = 'LuksNMDS'
GITHUB_REPO_NAME = 'mapa-tcc-imagens'
GITHUB_BRANCH = 'main'
PATH_TO_IMAGES = 'static/imagens'
CACHE_FILENAME = 'paleo_cache.json'
CACHE_MAX_AGE_HOURS = 24 # O cache será considerado válido por 24 horas
# --------------------

app = Flask(__name__)

# --- Lógica de Processamento de Dados ---

MAPEAMENTO_DE_ERAS = {
    # Períodos Principais
    'cretaceous': 'cretaceo',
    'jurassic': 'jurassico',
    'triassic': 'triassico',
    'permian': 'permiano',
    'carboniferous': 'carbonifero',
    'devonian': 'devoniano',
    'silurian': 'siluriano',
    'ordovician': 'ordoviciano',
    'cambrian': 'cambriano',
    'quaternary': 'quaternario',
    'neogene': 'neogeno',
    'pliocene': 'neogeno',
    'miocene': 'neogeno',
    'paleogene': 'paleogeno',
    'eocene': 'paleogeno',
    'oligocene': 'paleogeno',
    'paleocene': 'paleogeno',
    'pleistocene': 'quaternario',
    'lujanian': 'quaternario',
    'ensenadan': 'quaternario',
    'sanandresian': 'quaternario',
    'uquian': 'quaternario',

    # Sub-eras - Cretáceo
    'edmontonian': 'cretaceo',
    'judithian': 'cretaceo',
    'lancian': 'cretaceo',
    'maastrichtian': 'cretaceo',
    'campanian': 'cretaceo',
    'santonian': 'cretaceo',
    'coniacian': 'cretaceo',
    'turonian': 'cretaceo',
    'cenomanian': 'cretaceo',
    'albian': 'cretaceo',
    'aptian': 'cretaceo',
    'neocomian': 'cretaceo',
    'barremian': 'cretaceo',
    'hauterivian': 'cretaceo',
    'valanginian': 'cretaceo',
    'berriasian': 'cretaceo',
    'mata': 'cretaceo',
    'haumurian': 'cretaceo',
    'piripauan': 'cretaceo',
    'raukumara': 'cretaceo',
    'teratan': 'cretaceo',
    'mangaotanean': 'cretaceo',
    'arowhanan': 'cretaceo',
    'ngaterian': 'cretaceo',
    'motuan': 'cretaceo',
    'urutawan': 'cretaceo',
    'korangan': 'cretaceo',
    'clarence': 'cretaceo',
    'taitai': 'cretaceo',

    # Sub-eras - Jurássico
    'tithonian': 'jurassico',
    'kimmeridgian': 'jurassico',
    'oxfordian': 'jurassico',
    'callovian': 'jurassico',
    'bathonian': 'jurassico',
    'bajocian': 'jurassico',
    'aalenian': 'jurassico',
    'toarcian': 'jurassico',
    'pliensbachian': 'jurassico',
    'sinemurian': 'jurassico',
    'hettangian': 'jurassico',
    'angulata': 'jurassico',
    'Parkinsoni': 'jurassico',
    'Garantiana': 'jurassico',
    'Subfurcatum': 'jurassico',
    'Sauzei': 'jurassico',
    'Laeviuscula': 'jurassico',
    'Discites': 'jurassico',
    'Humphresianum': 'jurassico',
    'Concavum': 'jurassico',
    'Murchisonae': 'jurassico',
    'Opalinum': 'jurassico',
    'Thouarsense': 'jurassico',
    'Levesquei': 'jurassico',
    'Variabilis': 'jurassico',
    'Bifrons': 'jurassico',
    'Serpentinum': 'jurassico',
    'Bifrons': 'jurassico',
    'Bifrons': 'jurassico',
    'Tenuicostatum': 'jurassico',
    'Spinatum': 'jurassico',
    'Margaritatus': 'jurassico',
    'Davoei': 'jurassico',
    'Ibex': 'jurassico',
    'Jamesoni': 'jurassico',
    'Raricostatum': 'jurassico',
    'Oxynotum': 'jurassico',
    'Obtusum': 'jurassico',
    'Turneri': 'jurassico',
    'Semicostatum': 'jurassico',
    'Bucklandi': 'jurassico',
    'Angulata': 'jurassico',
    'Liasicus': 'jurassico',
    'Planorbis': 'jurassico',

    # Sub-eras - Triássico
    'sevatian': 'triassico',
    'alaunian': 'triassico',
    'tuvalian': 'triassico',
    'lacian': 'triassico',
    'rhaetian': 'triassico',
    'norian': 'triassico',
    'carnian': 'triassico',
    'ladinian': 'triassico',
    'longobardian': 'triassico',
    'anisian': 'triassico',
    'olenekian': 'triassico',
    'induan': 'triassico',
    'falciferum': 'triassico',
    'smithian': 'triassico',
    'spathian': 'triassico',
    'dienerian': 'triassico',
    'griesbachian': 'triassico',
    'julian': 'triassico',
    'longobardian': 'triassico',
    'fassanian': 'triassico',
    'illyrian': 'triassico',
    'pelsonian': 'triassico',
    'bithynian': 'triassico',
    'aegean': 'triassico',

    # Sub-eras - Permiano
    'changhsingian': 'permiano',
    'wuchiapingian': 'permiano',
    'capitanian': 'permiano',
    'wordian': 'permiano',
    'roadian': 'permiano',
    'kungurian': 'permiano',
    'tatarian': 'permiano',
    'kazanian': 'permiano',
    'vyatkian': 'permiano',
    'severodvinian': 'permiano',
    'povolzhian': 'permiano',
    'sokian': 'permiano',
    'irenian': 'permiano',
    'ufimian': 'permiano',
    'filipovian': 'permiano',
    'saraninian': 'permiano',
    'sarginian': 'permiano',
    'burtsevian': 'permiano',
    'sterlitamakian': 'permiano',
    'tastubian': 'permiano',
    'Shikhanian': 'permiano',
    'Uskalykian': 'permiano',
    'urzhumian': 'permiano',
    'Surenian': 'permiano',
    'artinskian': 'permiano',
    'sakmarian': 'permiano',
    'asselian': 'permiano',
    'lopingian': 'permiano',
    'guadalupian': 'permiano',
    'cisuralian': 'permiano',
    'capitanian': 'permiano',
    'wordian': 'permiano',
    'roardian': 'permiano',
    'leonardian': 'permiano',
    'cathedralian': 'permiano',
    'hessian': 'permiano',
    'wolfcampian': 'permiano',
    'lexonian': 'permiano',
    'nealian': 'permiano',

    # Sub-eras - Carbonífero
    'gzhelian': 'carbonifero',
    'kasimovian': 'carbonifero',
    'moscovian': 'carbonifero',
    'bashkirian': 'carbonifero',
    'serpukhovian': 'carbonifero',
    'visean': 'carbonifero',
    'tournaisian': 'carbonifero',
    'pennsylvanian': 'carbonifero',
    'mississippian': 'carbonifero',
    'virgilian': 'carbonifero',
    'missourian': 'carbonifero',
    'desmoinesian': 'carbonifero',
    'atokan': 'carbonifero',
    'morrowan': 'carbonifero',
    'chesterian': 'carbonifero',
    'meramecian': 'carbonifero',
    'oseagean': 'carbonifero',
    'kinderhookian': 'carbonifero',
    'kuzel': 'carbonifero',
    'stephanian': 'carbonifero',
    'stephanian a': 'carbonifero',
    'stephanian b': 'carbonifero',
    'stephanian c': 'carbonifero',
    'cantabrian': 'carbonifero',
    'westphalian': 'carbonifero',
    'westphalian a': 'carbonifero',
    'westphalian b': 'carbonifero',
    'westphalian c': 'carbonifero',
    'westphalian d': 'carbonifero',
    'namurian': 'carbonifero',
    'yeadonian': 'carbonifero',
    'marsdenian': 'carbonifero',
    'kinderscoutian': 'carbonifero',
    'alportian': 'carbonifero',
    'chokierian': 'carbonifero',
    'arnsbergian': 'carbonifero',
    'pendleian': 'carbonifero',
    'warnantian': 'carbonifero',
    'brigantian': 'carbonifero',
    'asbian': 'carbonifero',
    'livian': 'carbonifero',
    'moliniacian': 'carbonifero',
    'holkerian': 'carbonifero',
    'arundian': 'carbonifero',
    'chadian': 'carbonifero',
    'ivorian': 'carbonifero',
    'hastarian': 'carbonifero',

    # Sub-eras - Devoniano
    'famennian': 'devoniano',
    'frasnian': 'devoniano',
    'givetian': 'devoniano',
    'eifelian': 'devoniano',
    'emsian': 'devoniano',
    'pragian': 'devoniano',
    'lochkovian': 'devoniano',

    # Sub-eras - Siluriano
    'pridoli': 'siluriano',
    'ludfordian': 'siluriano',
    'gorstian': 'siluriano',
    'homerian': 'siluriano',
    'sheinwoodian': 'siluriano',
    'telychian': 'siluriano',
    'aeronian': 'siluriano',
    'rhuddanian': 'siluriano',

    # Sub-eras - Ordoviciano
    'hirnantian': 'ordoviciano',
    'katian': 'ordoviciano',
    'sandbian': 'ordoviciano',
    'darriwilian': 'ordoviciano',
    'dapingian': 'ordoviciano',
    'floian': 'ordoviciano',
    'tremadocian': 'ordoviciano',

    # Sub-eras - Cambriano
    'stage 10': 'cambriano',
    'jiangshanian': 'cambriano',
    'paibian': 'cambriano',
    'guzhangian': 'cambriano',
    'drumian': 'cambriano',
    'wuliuan': 'cambriano',
    'stage 4': 'cambriano',
    'stage 3': 'cambriano',
    'stage 2': 'cambriano',
    'fortunian': 'cambriano',

    # Sub-eras - Quaternário
    'meghalayan': 'quaternario',
    'northgrippian': 'quaternario',
    'greenlandian': 'quaternario',
    'holocene': 'quaternario',
    'late pleistocene': 'quaternario',
    'chibanian': 'quaternario',
    'calabrian': 'quaternario',
    'gelasian': 'quaternario',
    'castlecliffian': 'quaternario',
    'nukumaruan': 'quaternario',
    'mangapanian': 'quaternario',
    'saintaugustinean': 'quaternario',
    'santarosean': 'quaternario',
    'rancholabrean': 'quaternario',
    'irvingtonian': 'quaternario',
    'blancan': 'quaternario',

    # Sub-eras - Neogeno
    'piacenzian': 'neogeno',
    'zanclean': 'neogeno',
    'messinian': 'neogeno',
    'tortonian': 'neogeno',
    'serravallian': 'neogeno',
    'langhian': 'neogeno',
    'burdigalian': 'neogeno',
    'aquitanian': 'neogeno',
    'waipipian': 'neogeno',
    'hemphilian': 'neogeno',
    'clarendonian': 'neogeno',
    'barstovian': 'neogeno',
    'hemingfordian': 'neogeno',
    'arikareean': 'neogeno',
    'opoitian': 'neogeno',
    'harrisonian': 'neogeno',
    'turolian': 'neogeno',
    'vallesian': 'neogeno',
    'astaracian': 'neogeno',
    'orleanian': 'neogeno',
    'agenian': 'neogeno',
    'MN 17': 'neogeno',
    'MN 16': 'neogeno',
    'MN 15': 'neogeno',
    'MN 14': 'neogeno',
    'MN 13': 'neogeno',
    'MN 12': 'neogeno',
    'MN 11': 'neogeno',
    'MN 10': 'neogeno',
    'MN 9': 'neogeno',
    'MN 8': 'neogeno',
    'MN 7+8': 'neogeno',
    'MN 7': 'neogeno',
    'MN 6': 'neogeno',
    'MN 5': 'neogeno',
    'MN 4': 'neogeno',
    'MN 3': 'neogeno',
    'MN 2': 'neogeno',
    'MN 1': 'neogeno',
    'Villafranchian': 'neogeno',
    'Ruscinian	': 'neogeno',
    'Turolian': 'neogeno',
    'Vallesian': 'neogeno',
    'Astaracian': 'neogeno',
    'Orleanian': 'neogeno',
    'Agenian': 'neogeno',
    'Vorohuean': 'neogeno',
    'Chapadmalalan': 'neogeno',
    'Montehermosan': 'neogeno',
    'Huayquerian': 'neogeno',
    'Chasicoan': 'neogeno',
    'Mayoan': 'neogeno',
    'Laventan': 'neogeno',
    'Colloncuran': 'neogeno',
    'Friasian': 'neogeno',
    'Santacrucian': 'neogeno',
    'Colhuehuapian': 'neogeno',
    'Deseadan': 'neogeno',

    # Sub-eras - Paleogeno
    'chattian': 'paleogeno',
    'rupelian': 'paleogeno',
    'priabonian': 'paleogeno',
    'bartonian': 'paleogeno',
    'lutetian': 'paleogeno',
    'ypresian': 'paleogeno',
    'thanetian': 'paleogeno',
    'selandian': 'paleogeno',
    'danian': 'paleogeno',
    'whitneyan': 'paleogeno',
    'orellan': 'paleogeno',
    'chadronian': 'paleogeno',
    'duchesnean': 'paleogeno',
    'uintan': 'paleogeno',
    'bridgerian': 'paleogeno',
    'wasatchian': 'paleogeno',
    'clarkforkian': 'paleogeno',
    'tiffanian': 'paleogeno',
    'torrejonian': 'paleogeno',
    'puercan': 'paleogeno',
    'tabenrulakian	': 'paleogeno',
    'bumbanian	': 'paleogeno',
    'houldjinian	': 'paleogeno',
    'ergilian	': 'paleogeno',
    'ulangochuian	': 'paleogeno',
    'hsandagolian	': 'paleogeno'
};

def get_periodo_principal(era):
    if not era: return 'outro'
    palavras = era.split('/')[-1].split()
    termo_principal = palavras[-1].lower()
    return MAPEAMENTO_DE_ERAS.get(termo_principal, 'outro')

def mapear_e_limpar_dados(records, imagens_disponiveis):
    """
    Processa os dados brutos da API, limpa registros inválidos e formata o resultado
    usando uma lógica simplificada e correta para o campo 'familia'.
    """
    dados_limpos = []
    imagens_set = set(imagens_disponiveis)

    for rec in records:
        if not all(k in rec and rec[k] is not None for k in ('lat', 'lng', 'eag', 'lag')):
            continue

        # --- Lógica de imagem  ---
        nome_base_genero = rec.get('gnn') or rec.get('tna') or ''
        genero = nome_base_genero.split(' ')[0]
        especie = rec.get('spn')
        nome_final_para_imagem = ''
        if genero and especie:
            nome_especifico = f"{genero}_{especie}"
            if nome_especifico in imagens_set:
                nome_final_para_imagem = nome_especifico
        if not nome_final_para_imagem and genero:
            if genero in imagens_set:
                nome_final_para_imagem = genero
        
        # ==========================================================
        # LÓGICA DE FAMÍLIA 
        # ==========================================================
        familia = rec.get('fml')
        if not familia or familia == 'NO_FAMILY_SPECIFIED':
            familia = 'Não definido'
        # ==========================================================

        ponto_formatado = {
            'genero': rec.get('tna') or rec.get('gnn') or 'Não identificado',
            'especie': rec.get('idt', '').split(' ')[1] if ' ' in rec.get('idt', '') else rec.get('spn', ''),
            'familia': familia, #
            'formacao': rec.get('sfn') or rec.get('sfm') or 'Não definida',
            'lat': float(rec['lat']), 'lng': float(rec['lng']),
            'inicio': rec['eag'], 'fim': rec['lag'],
            'periodo': get_periodo_principal(rec.get('oei') or rec.get('oli') or rec.get('pnm')),
            'imagem': f"https://raw.githubusercontent.com/LuksNMDS/mapa-tcc-imagens/main/static/imagens/{nome_final_para_imagem}.jpg" if nome_final_para_imagem else ""
        }
        dados_limpos.append(ponto_formatado)
        
    return dados_limpos


def obter_lista_de_taxons_do_github():
    try:
        branch_url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/branches/{GITHUB_BRANCH}"
        response = requests.get(branch_url, timeout=10)
        response.raise_for_status()
        tree_sha = response.json()['commit']['commit']['tree']['sha']
        tree_url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/git/trees/{tree_sha}?recursive=1"
        response = requests.get(tree_url, timeout=10)
        response.raise_for_status()
        tree_data = response.json()
        lista_de_taxons = []
        for file_info in tree_data['tree']:
            if file_info['path'].startswith(PATH_TO_IMAGES + '/') and file_info['path'].lower().endswith('.jpg'):
                filename = os.path.basename(file_info['path'])
                taxon_name = os.path.splitext(filename)[0]
                lista_de_taxons.append(taxon_name)
        print(f"SUCESSO: {len(lista_de_taxons)} táxons lidos do GitHub.", flush=True)
        return lista_de_taxons
    except requests.exceptions.RequestException as e:
        print(f"ERRO DE API GITHUB: {e}", flush=True)
        return []

def process_lote_com_erro(problematic_chunk, base_api_url, dados_brutos):
    """
    Tenta carregar cada táxon individualmente de um lote que falhou criticamente
    para isolar o nome problemático e salvar os táxons válidos.
    """
    
    print("\n--- INICIANDO ISOLAMENTO DE ERRO (Taxon por Taxon) ---", flush=True)
    
    base_payload = {
        'show': 'coords,phylo,ident,ages,strat',
        'limit': 'all'
    }
    
    for taxon_name in problematic_chunk:
        # Tenta carregar cada táxon individualmente (chunk_size = 1)
        base_payload['base_name'] = taxon_name
        
        try:
            print(f"DEBUG: Tentando carregar táxon individual: {taxon_name}", flush=True)
            response = requests.get(base_api_url, params=base_payload, timeout=30)
            response.raise_for_status()
            
            # Se deu sucesso, adiciona o dado e continua
            dados_do_lote = response.json()
            dados_brutos.extend(dados_do_lote.get('records', []))
            
        except requests.exceptions.RequestException as e:
            # Se falhou, este é o GÊNERO CULPADO
            print(f"!!! GÊNERO CULPADO IDENTIFICADO: '{taxon_name}' falhou com Erro: {e}. Será IGNORADO.", flush=True)

        # Pequena pausa para requisições individuais
        time.sleep(0.5) 

    print("--- FIM DO ISOLAMENTO DE ERRO ---", flush=True)        


# --- Rotas da Aplicação ---

@app.route('/')
def home():
    """
    Exibe a página da landing page.
    """
    return render_template('landing_page.html')

@app.route('/mapa/')
def mapa_fosseis():
    return render_template('index.html')


@app.route('/api/dados_fosseis/')
def api_dados_fosseis():
    """
    Endpoint de API que agora inclui uma lógica de cache.
    """
    print("API interna chamada: /api/dados_fosseis/", flush=True)
    
    # ==========================================================
    # INÍCIO DA LÓGICA DE CACHE
    # ==========================================================
    try:
        if os.path.exists(CACHE_FILENAME):
            # Pega a data de modificação tanto do arquivo de cache quanto do script app.py
            cache_mod_time = datetime.fromtimestamp(os.path.getmtime(CACHE_FILENAME))
            script_mod_time = datetime.fromtimestamp(os.path.getmtime(__file__))

            # O cache é válido SE:
            # 1. For mais novo que o tempo máximo definido (ex: 24 horas)
            # 2. E for mais recente que a última alteração no script app.py
            is_age_valid = datetime.now() - cache_mod_time < timedelta(hours=CACHE_MAX_AGE_HOURS)
            is_script_unchanged = cache_mod_time > script_mod_time

            if is_age_valid and is_script_unchanged:
                print("CACHE HIT: Retornando dados de um cache válido e atualizado.", flush=True)
                with open(CACHE_FILENAME, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                return jsonify(cached_data)
            else:
                # Informa por que o cache está sendo invalidado
                if not is_age_valid:
                    print("CACHE INFO: Invalidando cache por antiguidade.", flush=True)
                if not is_script_unchanged:
                    print("CACHE INFO: Invalidando cache pois o script 'app.py' foi modificado.", flush=True)

    except Exception as e:
        print(f"AVISO: Não foi possível ler o arquivo de cache. Erro: {e}", flush=True)

    print("CACHE MISS: Buscando novos dados das APIs...", flush=True)

    # Lista Manual, para taxons não listados nas imagens. 
    lista_de_imagens = obter_lista_de_taxons_do_github()
    lista_manual = [
        'Coelodonta', 'Eoraptor', 'Macrauchenia', 'Titanis', 'Kelenken', 
        'Devincenzia', 'Phorusrhacos', 'Dunkleosteus', 'Indohyus', 'Pakicetus',
        'Ambulocetus', 'Maiacetus', 'Dorudon'
    ]
    lista_final_para_api = sorted(list(set(lista_de_imagens + lista_manual)))
    print(f"Total de {len(lista_final_para_api)} táxons únicos para buscar.", flush=True)

    chunk_size = 500
    dados_brutos = []
    max_tentativas = 3
    base_api_url = "https://paleobiodb.org/data1.2/occs/list.json" 

    for i in range(0, len(lista_final_para_api), chunk_size):
        chunk = lista_final_para_api[i:i+chunk_size]
        lista_de_taxons_string = ','.join(chunk)
 
        payload = {
            'base_name': lista_de_taxons_string,
            'show': 'coords,phylo,ident,ages,strat',
            'limit': 'all'
        }

        lote_foi_processado_com_sucesso = False
        
        for tentativa in range(max_tentativas):
            try:
                print(f"Buscando lote {i//chunk_size + 1}, tentativa {tentativa + 1}...", flush=True)
                response = requests.get(base_api_url, params=payload, timeout=30)
                response.raise_for_status()
                
                dados_do_lote = response.json()
                dados_brutos.extend(dados_do_lote.get('records', []))
                lote_foi_processado_com_sucesso = True
                break
            except requests.exceptions.RequestException as e:
                print(f"AVISO: Falha na tentativa {tentativa + 1}. Erro: {e}", flush=True)
                if tentativa < max_tentativas - 1:
                    time.sleep(1)
        
        if not lote_foi_processado_com_sucesso:

            print(f"ERRO CRÍTICO: O Lote {i//chunk_size + 1} falhou. Iniciando isolamento de táxons...", flush=True)
            process_lote_com_erro(chunk, base_api_url, dados_brutos)
            # ======================================================================

        time.sleep(2) # Pausa para evitar sobrecarga no servidor
 
    print(f"Carregamento bruto concluído! {len(dados_brutos)} ocorrências recebidas.", flush=True)


    dados_processados = mapear_e_limpar_dados(dados_brutos, lista_de_imagens)
    print(f"Processamento concluído! {len(dados_processados)} ocorrências válidas.", flush=True)

    response_data = { 'dados_processados': dados_processados }
    try:
        with open(CACHE_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(response_data, f, ensure_ascii=False, indent=4)
        print(f"CACHE WRITE: Novos dados salvos em '{CACHE_FILENAME}'.", flush=True)
    except Exception as e:
        print(f"AVISO: Falha ao salvar os dados no arquivo de cache. Erro: {e}", flush=True)
    
    return jsonify(response_data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5012, debug=True)
