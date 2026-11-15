const {domainEditorMarkup} = require('./domain-editor.js');
function cleanupEditor(type) {
  const prefix = {cookies: '', cache: 'cache', localStorage: 'localStorage'}[type];
  if (prefix === undefined) throw new Error('Invalid cleanup editor');
  const id = key => prefix ? prefix + key[0].toUpperCase() + key.slice(1) : key;
  const editor = domainEditorMarkup({form: true, importLink: true,
    ids: {form:id('domainForm'), input:id('domainInput'), count:id('listCount'), list:id('domainList'), empty:id('emptyList'), import:id('goImport')},
    labels: {domain:'Domínio ou URL', add:'Adicionar', count:'0 domínios', empty:'Nenhum domínio nesta lista.', import:'Importar de favoritos →'},
    markers: {domain:'uiDomainorURL10cc7', add:'uiAddfadcf', empty:'uiNodomainsinthislist5b710', import:'uiImportfrombookmarksa9c2c'},
  });
  return `<fieldset id="${id('filterEditor')}" class="cleanup-site-filter">
    <label class="ui-field field" for="${id('listMode')}"><span data-i18n="uiCleanupListMode">Modo da lista</span>
      <select class="ui-control" id="${id('listMode')}">
        <option value="exclude" data-i18n="uiCleanupExclude">Excluir da limpeza — preservar a lista</option>
        <option value="include" data-i18n="uiCleanupInclude">Incluir na limpeza — limpar somente a lista</option>
      </select>
    </label><p id="${id('listModeHelp')}" class="note" role="status"></p>
    ${editor}
  </fieldset><button type="button" class="ui-button" id="${id('filterRetry')}" data-i18n="uiCleanupRetry" hidden>Tentar novamente</button>`;
}
module.exports = {cleanupEditor};
