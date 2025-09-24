// Sistema para normalizar dados da API real
window.DataNormalizer = {
    
    // Normalizar um valor numérico
    normalizeNumber(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        
        // Se já é um número
        if (typeof value === 'number') {
            return isNaN(value) ? defaultValue : value;
        }
        
        // Se é uma string, tentar converter
        if (typeof value === 'string') {
            // Remover caracteres não numéricos exceto ponto e vírgula
            const cleanValue = value.replace(/[^\d.,]/g, '');
            const numValue = parseFloat(cleanValue.replace(',', '.'));
            return isNaN(numValue) ? defaultValue : numValue;
        }
        
        return defaultValue;
    },
    
    // Normalizar CTR (Click-Through Rate)
    normalizeCTR(value) {
        const num = this.normalizeNumber(value, 0);
        
        // Se o valor já está em porcentagem (>1), manter
        // Se está em decimal (0-1), converter para porcentagem
        if (num <= 1) {
            return num * 100;
        }
        
        return num;
    },
    
    // Normalizar moeda
    normalizeCurrency(value) {
        return this.normalizeNumber(value, 0);
    },
    
    // Normalizar dados de campanha
    normalizeCampaignData(campaign) {
        console.log('🔧 Normalizando dados da campanha:', campaign.name);
        
        return {
            id: campaign.id || '',
            name: campaign.name || 'Campanha sem nome',
            status: campaign.status || 'PAUSED',
            impressions: this.normalizeNumber(campaign.impressions, 0),
            clicks: this.normalizeNumber(campaign.clicks, 0),
            ctr: this.normalizeCTR(campaign.ctr || 0),
            cpc: this.normalizeCurrency(campaign.cpc, 0),
            conversions: this.normalizeNumber(campaign.conversions, 0),
            spend: this.normalizeCurrency(campaign.spend, 0),
            // Campos adicionais que podem existir
            reach: this.normalizeNumber(campaign.reach, 0),
            frequency: this.normalizeNumber(campaign.frequency, 0),
            cost_per_conversion: this.normalizeCurrency(campaign.cost_per_conversion, 0),
            roas: this.normalizeNumber(campaign.roas, 0),
            // Dados originais para debug
            _original: campaign
        };
    },
    
    // Normalizar lista de campanhas
    normalizeCampaigns(campaigns) {
        if (!campaigns || !Array.isArray(campaigns)) {
            console.warn('⚠️ Dados de campanhas inválidos:', campaigns);
            return [];
        }
        
        console.log(`🔧 Normalizando ${campaigns.length} campanhas`);
        
        return campaigns.map(campaign => {
            try {
                return this.normalizeCampaignData(campaign);
            } catch (error) {
                console.error('❌ Erro ao normalizar campanha:', error, campaign);
                // Retornar campanha com dados padrão em caso de erro
                return {
                    id: campaign.id || Date.now().toString(),
                    name: campaign.name || 'Erro ao carregar',
                    status: 'PAUSED',
                    impressions: 0,
                    clicks: 0,
                    ctr: 0,
                    cpc: 0,
                    conversions: 0,
                    spend: 0,
                    _error: error.message
                };
            }
        });
    },
    
    // Normalizar insights de campanhas
    normalizeInsights(insights) {
        if (!insights || !insights.data || !Array.isArray(insights.data)) {
            console.warn('⚠️ Dados de insights inválidos:', insights);
            return [];
        }
        
        console.log(`🔧 Normalizando ${insights.data.length} insights`);
        
        return insights.data.map(insight => {
            return {
                campaign_id: insight.campaign_id || insight.adset_id || insight.ad_id,
                campaign_name: insight.campaign_name || 'Campanha',
                date_start: insight.date_start,
                date_stop: insight.date_stop,
                impressions: this.normalizeNumber(insight.impressions, 0),
                clicks: this.normalizeNumber(insight.clicks, 0),
                ctr: this.normalizeCTR(insight.ctr, 0),
                cpc: this.normalizeCurrency(insight.cpc, 0),
                cpp: this.normalizeCurrency(insight.cpp, 0),
                cpm: this.normalizeCurrency(insight.cpm, 0),
                spend: this.normalizeCurrency(insight.spend, 0),
                actions: insight.actions || [],
                conversions: this.normalizeNumber(
                    this.extractConversions(insight.actions), 0
                ),
                reach: this.normalizeNumber(insight.reach, 0),
                frequency: this.normalizeNumber(insight.frequency, 0)
            };
        });
    },
    
    // Extrair conversões das ações
    extractConversions(actions) {
        if (!actions || !Array.isArray(actions)) {
            return 0;
        }
        
        let totalConversions = 0;
        
        actions.forEach(action => {
            // Tipos de ação que contam como conversões
            const conversionTypes = [
                'purchase',
                'lead',
                'complete_registration',
                'add_to_cart',
                'initiate_checkout',
                'conversions'
            ];
            
            if (conversionTypes.includes(action.action_type)) {
                totalConversions += this.normalizeNumber(action.value, 0);
            }
        });
        
        return totalConversions;
    },
    
    // Debug: mostrar comparação antes/depois
    debugNormalization(originalData, normalizedData) {
        console.group('🔍 Debug Normalização de Dados');
        console.log('📊 Dados originais:', originalData);
        console.log('✅ Dados normalizados:', normalizedData);
        console.groupEnd();
    }
};

// Função global de conveniência
window.normalizeCampaigns = function(campaigns) {
    return DataNormalizer.normalizeCampaigns(campaigns);
};

window.normalizeInsights = function(insights) {
    return DataNormalizer.normalizeInsights(insights);
};

console.log('🔧 Data Normalizer carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• normalizeCampaigns(data) - Normalizar dados de campanhas');
console.log('• normalizeInsights(data) - Normalizar dados de insights');