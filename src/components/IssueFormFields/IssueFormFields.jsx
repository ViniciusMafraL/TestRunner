import { useState } from 'react';
import { Keywords, Platform, Severity, Store } from 'shared/enums.js';
import { useOperations } from '../../operations/OperationContext.jsx';
import { useQaUsers } from '../../hooks/useQaUsers.js';
import { FIELD_ICONS } from '../FieldIcons/FieldIcons.jsx';
import { Dropdown } from '../Dropdown/Dropdown.jsx';
import { MultiSelectDropdown } from '../Dropdown/MultiSelectDropdown.jsx';
import { EvidencePicker } from '../EvidencePicker/EvidencePicker.jsx';

/* Campos principais sempre visíveis; os demais ficam atrás de "Mais campos".
   Found By fica fora desta lista: é multi-seleção com os QAs registrados. */
const PRIMARY_SELECTS = [
  { name: 'severity', label: 'Severity', options: Severity },
  { name: 'platform', label: 'Platform', options: Platform },
];

/* Keywords e Tag ficam fora desta lista: Keywords é multi-seleção; Tag depende
   dos valores da operação (tagValues) e por isso é montada no render. */
const EXTRA_SELECTS = [{ name: 'store', label: 'Store', options: Store }];

function SelectRow({ idPrefix, field, value, onChange }) {
  const id = `${idPrefix}-${field.name}`;
  return (
    <div className="field-row">
      <label className="field-label" htmlFor={id}>
        {FIELD_ICONS[field.name]}
        {field.label}
      </label>
      <div className="field-control">
        <Dropdown id={id} value={value} options={['', ...field.options]} onChange={(next) => onChange(field.name, next)} />
      </div>
    </div>
  );
}

/**
 * Miolo do formulário de issue — Version, Severity, Platform, Found By,
 * Evidências e o bloco "Mais campos" (Tag, Store, Keywords, Attachment).
 *
 * Usado pelo Reporter e pelo modo de edição do IssueDetailModal, para que as
 * duas telas não possam divergir: mesma ordem, mesmos rótulos, mesmo seletor
 * de evidências. O que é exclusivo do Reporter (a linha "Destino") entra por
 * `afterVersion`.
 *
 * `idPrefix` mantém os ids únicos quando os dois formulários coexistem no DOM.
 */
export function IssueFormFields({
  idPrefix = 'field',
  form,
  onChange,
  fieldErrors = {},
  evidenceFiles,
  onEvidenceChange,
  afterVersion = null,
  disabled = false,
}) {
  const { tagValues } = useOperations();
  const qaUsers = useQaUsers();
  const [showExtra, setShowExtra] = useState(false);

  return (
    <>
      <div className="field-row">
        <label className="field-label" htmlFor={`${idPrefix}-version`}>
          {FIELD_ICONS.version}
          Version *
        </label>
        <div className="field-control">
          <input
            id={`${idPrefix}-version`}
            type="text"
            placeholder="0.0.0"
            value={form.version}
            disabled={disabled}
            onChange={(event) => onChange('version', event.target.value)}
          />
          {fieldErrors.version ? (
            <span role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)' }}>
              {fieldErrors.version}
            </span>
          ) : null}
        </div>
      </div>

      {afterVersion}

      {PRIMARY_SELECTS.map((field) => (
        <SelectRow
          key={field.name}
          idPrefix={idPrefix}
          field={field}
          value={form[field.name]}
          onChange={onChange}
        />
      ))}

      <div className="field-row">
        <label className="field-label" htmlFor={`${idPrefix}-foundBy`}>
          {FIELD_ICONS.foundBy}
          Found By
        </label>
        <div className="field-control">
          <MultiSelectDropdown
            id={`${idPrefix}-foundBy`}
            ariaLabel="Found By"
            value={form.foundBy}
            options={qaUsers}
            onChange={(next) => onChange('foundBy', next)}
          />
        </div>
      </div>

      {onEvidenceChange ? (
        <div className="field-row">
          <span className="field-label">
            {FIELD_ICONS.attachment}
            Evidências
          </span>
          <div className="field-control">
            <EvidencePicker files={evidenceFiles} onChange={onEvidenceChange} disabled={disabled} />
          </div>
        </div>
      ) : null}

      <button type="button" className="form-more-toggle" onClick={() => setShowExtra((previous) => !previous)}>
        <span aria-hidden="true">{showExtra ? '▾' : '▸'}</span>
        {showExtra ? 'Ocultar campos extras' : 'Mais campos (Tag, Keywords, Store, Attachment)'}
      </button>

      {showExtra ? (
        <>
          {tagValues.length > 0 ? (
            <SelectRow
              idPrefix={idPrefix}
              field={{ name: 'tag', label: 'Tag', options: tagValues }}
              value={form.tag}
              onChange={onChange}
              disabled={disabled}
            />
          ) : null}
          {EXTRA_SELECTS.map((field) => (
            <SelectRow
              key={field.name}
              idPrefix={idPrefix}
              field={field}
              value={form[field.name]}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
          <div className="field-row">
            <label className="field-label" htmlFor={`${idPrefix}-keywords`}>
              {FIELD_ICONS.keywords}
              Keywords
            </label>
            <div className="field-control">
              <MultiSelectDropdown
                id={`${idPrefix}-keywords`}
                ariaLabel="Keywords"
                value={form.keywords}
                options={Keywords}
                onChange={(next) => onChange('keywords', next)}
              />
            </div>
          </div>
          <div className="field-row">
            <label className="field-label" htmlFor={`${idPrefix}-attachment`}>
              {FIELD_ICONS.attachment}
              Attachment
            </label>
            <div className="field-control">
              <input
                id={`${idPrefix}-attachment`}
                type="text"
                placeholder="Link do Google Drive"
                value={form.attachment}
                disabled={disabled}
                onChange={(event) => onChange('attachment', event.target.value)}
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
