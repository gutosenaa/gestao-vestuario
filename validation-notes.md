# Registro de validação visual

- A visualização desktop confirmou a marca **FEIRENSE — Gestão Esportiva** no menu lateral, a navegação por módulos e o contraste dos cards executivos.
- A visualização mobile confirmou o cabeçalho compacto, os botões de ação principais legíveis, os cards em coluna única e a navegação inferior acessível.
- A compilação, a verificação de tipos e os testes automatizados passaram após as melhorias de venda rápida, financeiro e estados de falha.

## Acessibilidade básica

Os controles principais receberam rótulos acessíveis, incluindo o menu móvel, a busca global, os alertas e as ações de fechar. A navegação móvel e os resultados da busca informam seu estado semântico, enquanto os controles interativos revisados exibem foco visível ao uso por teclado. O estado de erro das consultas usa uma região de alerta e mantém uma ação clara de recarregamento. A verificação de tipos, os testes automatizados e a compilação de produção foram executados após essas alterações com sucesso.

## Responsividade após os filtros

A verificação desktop confirmou que o seletor de período, a entrada para relatórios e a venda rápida permanecem alinhados acima dos indicadores executivos. A verificação mobile confirmou que essas mesmas ações quebram em linhas legíveis, preservam área de toque adequada e não sobrepõem os cards ou a navegação inferior.

## Validação técnica final

A verificação final executou a checagem de tipos, a suíte automatizada e a compilação de produção. Os **7 testes** foram aprovados e não foram encontrados registros recentes de `error`, `exception`, `fatal` ou `unhandled` nos logs do servidor e do navegador. O aviso de tamanho de bundle do gerador de produção permanece como recomendação de otimização futura, sem impedir a compilação ou o funcionamento atual.

Depois da revisão do resumo financeiro da venda rápida, foi adicionada uma cobertura específica para taxas simultâneas de canal e pagamento. A suíte passou a ter **8 testes aprovados** e confirmou que o valor a receber subtrai as taxas de canal e pagamento, enquanto o imposto permanece explicitamente como impacto sobre o lucro.

## Painel consolidado — desktop e mobile

Na largura desktop, o painel preserva hierarquia clara entre seletor de período, ações, KPIs, evolução financeira, alertas, rankings e decisões de estoque. Na largura mobile, os mesmos blocos se tornam uma sequência em coluna única sem transbordamento, mantendo botões visíveis no topo, textos legíveis, cards espaçados e navegação inferior fora da área de conteúdo.

## Auditoria semântica de navegação

Foi verificado o uso de nomes acessíveis e de estados nos controles globais: abertura e fechamento de menu móvel, busca global, resultados de busca, alertas, navegação principal e ações de saída. Os controles examinados têm rótulos ARIA, estados atuais de página quando aplicável e estilos de foco visível; a busca expõe resultados como lista de opções com nomes descritivos.

O formulário de criação de produtos recebeu nomes programáticos para todos os campos de texto, números, listas e foto. A orientação e eventuais falhas de upload da imagem ficam vinculadas ao campo e são anunciadas como alerta. A checagem de tipos, os **8 testes** e a compilação de produção passaram após esse ajuste.

Os formulários de criação e edição de clientes e fornecedores também receberam nomes programáticos para dados pessoais, empresa, contato, endereço, URL e observações. A entrada manual de estoque possui nomes para quantidade e custo. Esses ajustes foram validados com a mesma checagem de tipos, testes e compilação de produção.

## Venda rápida — mobile

A abertura direta por `?view=venda` confirmou a composição da tela de venda rápida no preview em largura mobile. O estado sem estoque comunica a próxima ação, o resumo compacto fica acima do formulário, os controles de desconto, canal e pagamento permanecem legíveis e o bloco financeiro mostra taxas, imposto e valor a receber. As ações de compartilhar e concluir venda permanecem visíveis no fim do fluxo sem sobreposição.

Na largura desktop, o fluxo distribui a adição de peças e o resumo financeiro em duas colunas, mantendo o resumo em posição estável e deixando desconto, canal, forma de pagamento, valor a receber e ações de conclusão no mesmo campo visual.

## Módulos operacionais — desktop

Produtos, estoque, financeiro e relatórios foram revisados em abertura direta. As telas preservam o cabeçalho, as ações de entrada e cards de decisão; os estados sem dados indicam uma ação seguinte objetiva. O Financeiro mantém a separação dos resultados, enquanto Relatórios reúne KPIs, consolidados, rankings, reposição e exportações na mesma página.

Em mobile, Produtos, Financeiro, Relatórios e Estoque se reorganizam em coluna sem cortes ou sobreposições. Os CTAs de cadastro e compra ocupam largura confortável, os cards financeiros e de estoque preservam contraste e os relatórios mantêm os blocos de consolidação, ranking, decisão e exportação legíveis em rolagem contínua.

## Limitação de validação autenticada

A tentativa de abrir o aplicativo pelo navegador redirecionou para a autenticação Google e permaneceu no campo de senha. Por segurança, a senha não foi preenchida pelo agente. Portanto, as capturas recentes de módulos por URL comprovam a composição e os estados públicos de fallback, mas não comprovam operações autenticadas com dados reais. Os itens de validação funcional autenticada permanecem pendentes até a conclusão desse passo no navegador.

A venda rápida recebeu nomes programáticos para produto/tamanho/tipo, quantidade, preço unitário, desconto, canal e forma de pagamento. A validação técnica posterior passou com checagem de tipos, **8 testes** e compilação de produção; a confirmação funcional autenticada permanece separada por depender da sessão Google.

Compras e despesas receberam nomes programáticos para produto, fornecedor, pedido, quantidade, custo, descrição, categoria e valor. A checagem de tipos, os **8 testes** e o build de produção passaram após a alteração. A validação de interação autenticada permanece condicionada ao login manual no navegador.

## Evidências visuais do preview

O preview permitiu capturar dashboard, produtos, estoque, financeiro, relatórios e venda rápida em desktop, além da venda rápida em mobile. Foram observados: identidade FEIRENSE no menu desktop, cards e CTAs sem sobreposição, estados vazios orientados, separação financeira, filtros e exportações visíveis, e a venda rápida com resumo compacto, desconto, canal, pagamento, impacto financeiro, compartilhamento e conclusão. O estado autenticado da venda rápida sem estoque foi validado em ambas as larguras; o sucesso transacional com produto real permanece dependente de haver estoque cadastrado para não inserir dados de teste.

A abertura direta `?menu=open` confirmou visualmente o menu móvel em 375px: a marca FEIRENSE aparece no topo, o botão de fechamento é identificável, os módulos permanecem navegáveis em coluna e o bloco de perfil com saída fica acessível no rodapé.

A tela de precificação recebeu nomes programáticos para o produto analisado e o preço promocional simulado. A checagem de tipos, os **8 testes** e a compilação de produção passaram novamente; a interação com dados reais segue condicionada à sessão autenticada.

## Evidência estática complementar de acessibilidade

A inspeção do código confirmou `aria-label`, `aria-current`, `aria-expanded`, `role="listbox"`, `role="option"`, regiões `role="alert"` e estilos `focus-visible` na navegação global, busca, menu móvel, alertas, cadastro de produto, upload de foto, precificação e simulador promocional. Essa evidência é técnica e não substitui a validação manual completa por teclado e leitor de tela nas telas autenticadas.

As ações do dashboard receberam nomes programáticos para período, relatórios, venda rápida e registro de compra no estado vazio. A checagem de tipos, os **8 testes** e o build de produção passaram novamente; o aviso de bundle grande permanece apenas como recomendação de otimização.

Os controles do relatório gerencial receberam nomes programáticos para período, impressão em PDF e exportação CSV para Excel. A checagem de tipos, os **8 testes** e a compilação de produção passaram após o ajuste; a ação de impressão continua sendo executada pelo navegador.

Os botões de adicionar peça, compartilhar resumo, concluir venda e registrar compra receberam nomes programáticos orientados à ação. A checagem de tipos, os **8 testes** e o build de produção passaram após o ajuste.

## Bloqueio OAuth

A tentativa de autenticação manual retornou `invalid oauth state`. Nenhuma senha foi processada pelo agente e nenhum dado transacional de teste foi inserido. O aplicativo permanece publicado no estado estável; as validações técnicas, visuais do preview e de tipos/testes/build continuam registradas, enquanto os fluxos autenticados com produto real aguardam uma nova sessão OAuth válida.

## Diagnóstico técnico do OAuth

Os registros locais mostram o Vite e o coletor de depuração iniciando normalmente, sem exceção de aplicação ou falha de consulta associada ao login. O erro `invalid oauth state` apareceu no fluxo externo da conta Google antes de a sessão retornar ao aplicativo; por isso, não há correção segura a aplicar no código do PWA sem alterar o fluxo OAuth gerenciado.

## Matriz técnica sem dados transacionais

| Área | Cobertura confirmada | Limitação atual |
|---|---|---|
| Regras de cálculo | 8 testes Vitest aprovados, incluindo FIFO, precificação, desconto e taxas combinadas | Nenhuma limitação técnica identificada |
| Build e tipos | `pnpm check` e `pnpm build` aprovados | Permanece o aviso não bloqueante de chunk grande |
| Navegação e PWA | Layout cinematográfico FEIRENSE, PWA, estados de erro/vazio e navegação responsiva revisados no preview | Fluxos com dados reais aguardam sessão válida |
| Acessibilidade | Rótulos ARIA, foco visível, estados semânticos e ações principais documentados | Validação manual completa por teclado/leitor de tela aguarda sessão válida |
| Operações comerciais | Contratos e integração transacional cobertos pelos testes existentes | Compra/venda real no navegador não foi executada por causa do `invalid oauth state` |

## Catálogo dependente de liga e time

Foi criado um catálogo centralizado de principais clubes por Brasileirão, Copa do Brasil, Libertadores, Champions League, Premier League e La Liga. No cadastro e na edição, a escolha da liga antecede o time; trocar a liga limpa o time anterior e a lista é atualizada. A checagem de tipos, os **8 testes** e o build passaram; a verificação manual com dados reais continua condicionada à sessão OAuth.

A cobertura do catálogo foi incorporada à suíte oficial: `server/clubCatalog.test.ts` valida todas as ligas cadastradas, a presença de clubes e o fallback `Outro` para competição personalizada. Agora são **10 testes aprovados em 4 arquivos**, além da checagem de tipos.

O catálogo foi revisado visualmente em desktop (1280px) e mobile (375px). O botão de adicionar produto, o estado vazio e a navegação inferior permanecem visíveis e utilizáveis; o modal de campos dependentes segue condicionado à abertura do cadastro e à sessão autenticada.

## Validação autenticada do cadastro de produto

Em 13/08/2026, uma nova navegação na home publicada iniciou com sessão válida e abriu o catálogo sem erro OAuth. O modal “Novo produto” exibiu liga/campeonato e time dependentes; o campo de time ficou desabilitado antes da seleção da liga, com a mensagem “Escolha a liga primeiro”. Também foram confirmados tipo de camisa, tamanho, quantidade inicial, custo unitário e input de foto. A inspeção foi somente de leitura; nenhum produto foi salvo.

A validação manual autenticada continuou sem persistência: a lista exibiu Brasileirão, Copa do Brasil, Libertadores, Champions League, Premier League, La Liga e Outro. Após selecionar Brasileirão, o campo de time foi habilitado e passou a mostrar “Selecione o time da liga”, confirmando a dependência entre os dois selects.

## Venda rápida autenticada sem estoque

A abertura autenticada de `?view=venda` confirmou o estado vazio real: “Estoque indisponível” orienta registrar uma compra, o resumo mostra zero itens, desconto, canal, forma de pagamento, impacto financeiro com taxas/imposto zerados e total de R$ 0,00. Compartilhar e Concluir venda permanecem desabilitados sem itens, evitando uma operação inválida. Nenhum dado foi criado.

## Produto temporário autorizado

Foi criado, após confirmação explícita, o produto **COD001 — VALIDAÇÃO FEIRENSE TEMPORÁRIO**, com liga Brasileirão, time Flamengo, temporada 2026/27, tipo Casa, tamanho M, preço de venda de R$ 180,00, custo unitário de R$ 100,00 e estoque inicial de 2 unidades. O catálogo confirmou o produto ativo e disponível.

## Venda autenticada com desconto e taxas

No fluxo de venda rápida, o seletor mostrou COD001 com tipo Casa, tamanho M e saldo de 2 unidades. Foi adicionada 1 unidade a R$ 180,00, aplicado desconto de R$ 10,00, selecionado Mercado Livre (16,0%) e Pix. O resumo recalculou total de R$ 170,00, taxa de canal de R$ 27,20, pagamento sem taxa e valor a receber de R$ 142,80. A ação de compartilhar ficou disponível e o estado estava pronto para conclusão.

O compartilhamento abriu a página oficial “Share on WhatsApp” com o resumo pré-preenchido: 1x COD001 — Casa • M, pagamento Pix, desconto de R$ 10,00 e total de R$ 170,00. A mensagem não foi enviada a nenhum contato; a validação confirmou apenas a geração do texto e a abertura externa.
## Encerramento da validação autorizada

As tentativas autenticadas de concluir a venda do COD001 permaneceram em “Registrando...” e consultas diretas confirmaram que nenhuma venda foi persistida. O COD001 foi removido junto com seus movimentos, lote, alertas, auditoria e variantes. A verificação final confirmou product_count=0, movement_count=0, lot_count=0, sale_count=0 e finance_count=0 para o identificador temporário. A correção técnica de timeout e despacho não bloqueante das notificações passou em `pnpm check` e nos 12 testes, mas requer publicação e nova validação autenticada para comprovar o retorno em produção.
A tela autenticada de Produtos foi reaberta após a limpeza e exibiu “Seu catálogo começa aqui”, com as ações “Adicionar produto” e “Cadastrar primeira peça”; não há cartões de produtos. A consulta agregada confirmou total_products=0, total_inventory_movements=0, total_inventory_lots=0, total_sales=0 e total_financial_entries=0.
A correção do travamento recebeu regressão automatizada em `server/notification.test.ts`: uma requisição externa que não responde é abortada após 5 segundos e retorna `false`, sem rejeitar a operação. `pnpm check` e a suíte completa passaram com **13 testes aprovados**. O despacho de notificações de venda também passou a ser não bloqueante após o commit transacional.
A captura mobile em 375×812 confirmou, após a limpeza, três estados úteis: dashboard com KPIs em coluna e navegação inferior; venda rápida com resumo zerado e “Estoque indisponível”; e Produtos com “Seu catálogo começa aqui”, CTA de cadastro e navegação inferior sem sobreposição.
O segundo cadastro temporário também permaneceu em “Criando...” sem inserir dados. Foram adicionados marcos de diagnóstico no backend para `db-ready`, configurações, último código, produto, lote, movimento, auditoria e retorno. No cliente, o formulário agora possui guardrail de 15 segundos: encerra o estado pendente, fecha o modal e orienta o usuário sem repetir a mutation automaticamente. `pnpm check` e a suíte completa continuam com **13 testes aprovados**.
O transporte tRPC agora usa `AbortController` com limite de 20 segundos e propaga o sinal do chamador; o cadastro avisa aos 15 segundos e trata erros de abort/timeout com mensagem específica, orientando verificar Produtos antes de repetir. A checagem de tipos e os **13 testes** passaram novamente. Ainda falta validar esse comportamento na produção e consultar o banco após a tentativa.
## Segunda validação autenticada concluída

Após a correção publicada, o COD001 foi localizado com duas unidades. A venda autenticada foi preparada com 1 unidade Casa • M, preço de R$ 180,00, desconto de R$ 10,00, Mercado Livre a 16% e Pix. O resumo exibiu total de R$ 170,00, taxa de canal de R$ 27,20, valor a receber de R$ 142,80 e margem estimada de 68,9%. A conclusão persistiu: venda VEN-E9BWHHTJ, 1 movimento de venda, lançamento financeiro de R$ 142,80, alerta de margem e atualização do dashboard para faturamento de R$ 170,00, lucro líquido de R$ 34,30 e 1 peça vendida.

A limpeza autorizada subsequente removeu o produto COD001, venda, item de venda, movimentos, lote, lançamento financeiro, alerta e auditorias relacionados. A consulta final confirmou `product_count=0`, `movement_count=0`, `lot_count=0`, `sale_count=0`, `sale_item_count=0`, `finance_count=0`, `alert_count=0` e `audit_count=0`. O compartilhamento da segunda rodada não foi reaberto porque a primeira tentativa já havia validado a geração do texto; não houve envio a contato.
A captura real em 375×812 após a publicação mostrou a venda rápida mobile com cabeçalho compacto, título “Venda em poucos toques”, resumo atual líquido estimado, controles de produto/quantidade/preço, CTA de adicionar à venda e navegação inferior sem sobreposição. A ferramenta de captura não reproduziu a seleção interativa do COD001; a seleção e os cálculos preenchidos foram validados separadamente na sessão autenticada em 889×793.
## Segunda rodada de cadastro e limpeza

Na nova tentativa publicada, o toast confirmou `COD001 cadastrado com sucesso` e o cartão mostrou duas unidades, embora o modal permanecesse visualmente em “Criando...” por algum tempo; isso confirma persistência tardia, não duplicação. A captura mobile real de `?view=venda` em 375×812 confirmou a composição compacta e a navegação inferior. Como a captura automatizada não manipula os selects, o estado preenchido foi validado na sessão interativa desktop. O segundo COD001 (id 1680001) foi apagado depois, com lote e movimento, e a consulta final voltou a zerar produtos, movimentos, lotes, vendas, itens, financeiro, alertas e auditorias ligados às validações.
## Correção de imagens

O diagnóstico confirmou que a procedure `products.list` já retornava as colunas completas de `products`, incluindo `imageUrl`, e o upload fazia `storagePut` seguido de atualização de `imageKey`/`imageUrl`. O problema estava na interface: os cartões do catálogo, o detalhe do produto e o resumo da venda sempre exibiam ícones/quantidade e nunca renderizavam `imageUrl`. Foi adicionado `ProductImage`, com `alt` programático, `loading="lazy"`, `object-cover` e fallback silencioso quando a URL falhar. A miniatura agora aparece no cartão e detalhe do catálogo, na margem do produto selecionado e no resumo da venda. `pnpm check` e a suíte completa passaram com 13 testes.
## Ajuste de estoque em produto existente

Na sessão Admin, o produto COD001 exibiu a ação `+ Estoque`, renomeada para `Ajustar estoque` para tornar a função mais clara. O formulário aceitou quantidade 1 e custo unitário de R$ 100,00; a operação retornou `Estoque atualizado.` e o catálogo passou a mostrar 1 unidade disponível. A correção adicional invalida explicitamente `products.list`, `dashboard.overview` e `dashboard.inventory`, e fecha o detalhe antigo ao abrir o ajuste para evitar exibir saldo desatualizado. Nenhum produto foi apagado.
