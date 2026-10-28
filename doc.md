# Documentação do Clareza

## 1. Visão geral

Clareza é uma página web estática para visualizar um orçamento pessoal e fazer estimativas simples a partir dos dados informados. O usuário preenche renda, despesas, reserva financeira, aportes anteriores e perfil de risco. O resumo é recalculado no navegador sempre que um campo é alterado.

O sistema é composto por três arquivos:

- [`index.html`](./index.html): conteúdo, formulário e estrutura semântica da página.
- [`styles.css`](./styles.css): cores, tipografia, espaçamento, componentes e adaptação a diferentes telas.
- [`app.js`](./app.js): leitura dos campos, cálculos e atualização do resumo.

Não há servidor, banco de dados, autenticação, integração com instituições financeiras ou serviços de cotação. Portanto, os valores não são enviados a uma API nem salvos entre visitas. A tela inicial contém valores fictícios, identificados como exemplo.

## 2. Como abrir e utilizar

1. Abra o arquivo `index.html` em um navegador moderno. Não é necessário instalar dependências ou iniciar um servidor.
2. Atualize os campos do formulário com seus próprios valores.
3. O painel “Seu resumo” é atualizado automaticamente conforme a edição.
4. Para descartar os valores editados e voltar ao exemplo, recarregue a página.

O navegador pode apresentar os campos numéricos de acordo com as configurações regionais. Os valores de exemplo são inteiros em reais, e o resultado é exibido em reais sem casas decimais.

## 3. Estrutura da página

### 3.1 Cabeçalho

O cabeçalho mostra a marca Clareza e a indicação “Seus dados ficam neste dispositivo”. Como não existe backend, os cálculos acontecem no navegador e os campos não são enviados para fora pelo código da aplicação. O aviso não significa que os valores sejam persistidos: ao recarregar a página, o formulário volta aos valores fictícios definidos no HTML.

### 3.2 Apresentação

O título e o texto introdutório explicam o propósito da tela: apoiar o planejamento financeiro pessoal com um resumo compacto.

### 3.3 Formulário “Seu cenário”

Os campos estão agrupados em duas seções. Os campos monetários são entradas numéricas com limite mínimo zero. O atributo `step` sugere incrementos no controle do navegador; ele não é uma regra de arredondamento aplicada aos cálculos.

| Campo | Nome no código | Uso no cálculo |
|---|---|---|
| Salário mensal | `salary` | Base da estimativa de saldo mensal. |
| Custo doméstico mensal | `homeCost` | Despesa subtraída do salário mensal. |
| Outros custos mensais | `monthlyCost` | Despesa subtraída do salário mensal. |
| Parcelas de dívidas por mês | `debtPayments` | Despesa subtraída do salário mensal. |
| Despesas essenciais mensais | `essentialCost` | Base para calcular o valor de reserva de referência. |
| Custo anual | `annualCost` | Subtraído da renda anual para estimar saldo anual. |
| Renda anual | `annualIncome` | Base da estimativa de saldo anual. |
| Reserva financeira atual | `reserve` | Comparada com o valor de reserva de referência para escolher o texto da sugestão. |
| Aportes dos últimos meses | `contributions` | Série numérica usada para projetar o próximo aporte. |
| Perfil de risco | `riskProfile` | Escolhe um texto de contexto; não altera os valores calculados. |

Os valores que aparecem quando a página abre são exemplos fictícios. Eles não representam uma recomendação nem são uma estimativa do usuário.

### 3.4 Painel “Seu resumo”

O painel mostra a sugestão mensal, o saldo mensal, a reserva de referência, o saldo anual e a projeção do próximo aporte. A região usa `aria-live="polite"` para que tecnologias assistivas possam anunciar atualizações sem interromper imediatamente a leitura.

### 3.5 Acompanhamento de mercado

O “Radar de setores” informa que a pesquisa diária não está conectada. A interface não consulta cotações, notícias nem dados de mercado e não seleciona áreas de investimento. Para oferecer essa função, seria necessário integrar uma fonte de dados confiável e atualizada, além de definir como apresentar origem, data, riscos e eventuais indisponibilidades.

### 3.6 Aviso educativo

O rodapé explica que os resultados são estimativas educativas, não recomendações financeiras ou de investimento. Também informa a referência de 20% do saldo mensal e o uso de regressão linear simples na projeção de aportes.

## 4. Como os cálculos funcionam

Os cálculos são feitos pela função `updateSummary()` em [`app.js`](./app.js). Ela é chamada ao carregar o script e nos eventos `input` e `change` do formulário.

### 4.1 Leitura e exibição de valores

`readAmount(name)` lê um campo monetário pelo nome, converte seu conteúdo para número e trata valor vazio ou não numérico como zero. O resultado também é limitado para não ficar abaixo de zero. `formatCurrency(amount)` formata os números como moeda brasileira (`BRL`) usando `Intl.NumberFormat`.

### 4.2 Saldo mensal estimado

O sistema soma custo doméstico, outros custos e parcelas de dívidas e subtrai esse total do salário:

```text
saldo mensal = salário mensal
             - custo doméstico mensal
             - outros custos mensais
             - parcelas de dívidas por mês
```

Com os valores fictícios iniciais:

```text
R$ 6.500 - R$ 1.800 - R$ 1.400 - R$ 450 = R$ 2.850
```

O saldo pode ser negativo; nesse caso, ele é exibido com sinal negativo.

### 4.3 Reserva de referência

A reserva mostrada no resumo corresponde a seis meses das despesas essenciais:

```text
reserva de referência = despesas essenciais mensais × 6
```

Com o exemplo inicial, `R$ 2.500 × 6 = R$ 15.000`. O número seis é uma regra fixa da versão atual, não um valor configurável.

### 4.4 Próximo passo mensal

O valor mensal sugerido é calculado como 20% do saldo mensal positivo:

```text
próximo passo mensal = máximo(0, saldo mensal × 0,20)
```

Se o saldo mensal for negativo, a sugestão será zero. O valor atual da reserva **não** altera a quantia: apenas determina o rótulo e a legenda exibidos.

- Se a reserva atual for menor que a reserva de referência, o painel sugere fortalecer a reserva.
- Se a reserva atual for igual ou maior que a referência, o painel chama o mesmo valor de referência mensal para investir.

Essa distinção muda o texto, mas não transfere nem investe dinheiro. O cálculo não considera objetivos, impostos, liquidez, prazo ou outras despesas além das informadas.

### 4.5 Saldo anual estimado

O saldo anual é calculado separadamente do saldo mensal:

```text
saldo anual = renda anual - custo anual
```

Os custos mensais não são multiplicados por doze, e a renda mensal não é usada para completar a renda anual. Cabe ao usuário fornecer os valores anuais que deseja comparar.

### 4.6 Projeção do próximo aporte por regressão linear

O campo de aportes aceita números separados por vírgulas, em ordem cronológica, do mais antigo ao mais recente. Por exemplo, `300, 350, 400` representa três observações mensais.

`projectNextContribution(values)` ajusta uma reta de mínimos quadrados aos pontos:

```text
x = posição do mês na série (0, 1, 2, ...)
y = valor do aporte informado
y projetado = intercepto + inclinação × x
```

Os coeficientes da reta são obtidos pelas equações normais para regressão linear simples. A função então avalia a reta no índice seguinte ao último mês observado e limita a previsão mínima a zero.

Casos especiais:

- Sem valores numéricos válidos, o resumo mostra “Informe valores válidos”.
- Com apenas um aporte, esse mesmo valor é apresentado como projeção.
- Com dois ou mais aportes, é calculada a tendência linear.
- Uma previsão negativa é exibida como zero.

Essa projeção é uma extrapolação matemática da sequência informada, não uma previsão garantida de renda ou capacidade futura de investir.

### 4.7 Perfil de risco

As opções conservador, moderado e arrojado selecionam uma mensagem explicativa correspondente. O perfil não é usado para calcular carteira, retorno, risco quantitativo ou recomendação de produto.

## 5. Responsabilidade de cada arquivo

### `index.html`

Define o idioma como português do Brasil, o título da aba, a descrição da página, os pontos de carregamento do CSS e JavaScript e os componentes da interface. Os rótulos estão associados aos controles usando elementos `<label>`. As seções do formulário usam `<fieldset>` e `<legend>`, e os elementos decorativos são marcados com `aria-hidden="true"` quando não devem ser lidos por tecnologias assistivas.

O atributo `defer` no script adia a execução do JavaScript até que o HTML tenha sido analisado. Isso permite que o script encontre o formulário e os elementos do resumo já presentes na página.

### `styles.css`

Define as variáveis de cores e os estilos visuais. Os tons de vinho são usados na marca, nos destaques e no cartão de sugestão; o fundo bege e os tons neutros organizam as áreas de leitura. Os campos recebem realce de foco para indicar interação.

O layout usa CSS Grid para organizar formulário e resumo lado a lado em telas amplas. Em larguras menores, a media query de até 780 px empilha essas áreas. A media query de até 520 px reduz espaçamentos e reorganiza o cabeçalho da seção de mercado. A preferência do sistema por movimento reduzido também é respeitada.

### `app.js`

Localiza o formulário, cria o formatador de moeda, lê e valida de forma básica os campos, calcula os indicadores e atualiza os elementos identificados por `id`. Não realiza requisições de rede, armazenamento local ou operações no servidor.

## 6. Privacidade e persistência

Na versão atual:

- O processamento ocorre no navegador.
- O código não contém requisições para enviar o formulário a um servidor.
- Não há armazenamento em `localStorage`, `sessionStorage`, cookies ou banco de dados.
- Ao fechar ou recarregar a página, as edições são perdidas e os valores iniciais do HTML reaparecem.

Isso descreve o comportamento da aplicação; extensões do navegador, ferramentas de análise externas adicionadas futuramente ou o próprio ambiente de hospedagem podem ter políticas independentes.

## 7. Limitações conhecidas

1. **Sem dados de mercado:** não há pesquisa diária, cotações ou atualização de setores.
2. **Sem backend:** não existem contas, sincronização, APIs ou persistência.
3. **Estimativas simplificadas:** os cálculos não consideram toda a situação financeira da pessoa.
4. **Reserva fixa em seis meses:** o prazo é uma constante e pode não ser adequado a todos os casos.
5. **Referência de 20% fixa:** o percentual não é personalizado ou validado em relação a objetivos.
6. **Perfil qualitativo:** a escolha de perfil altera apenas a mensagem apresentada.
7. **Projeção sem análise de sazonalidade:** a regressão usa apenas a sequência fornecida e não conhece eventos futuros ou condições econômicas.
8. **Sem salvamento:** é necessário informar os valores novamente após recarregar.
9. **Valores anuais independentes:** não há conferência automática entre renda/salário mensal e renda anual, ou entre custos mensais e anuais.

## 8. Possíveis evoluções

Para transformar o protótipo em um sistema mais completo, podem ser consideradas, separadamente:

- Persistência opcional dos dados com consentimento claro.
- Backend para contas e sincronização segura entre dispositivos.
- Integração com uma fonte de mercado confiável, com data/hora, atribuição da fonte e tratamento de indisponibilidade.
- Melhor detalhamento de receitas, despesas, objetivos e horizonte de investimento.
- Testes automatizados para fórmulas, entradas inválidas e comportamento responsivo.
- Revisão profissional das regras financeiras antes de apresentar recomendações personalizadas.

Essas funcionalidades não fazem parte da versão documentada.
