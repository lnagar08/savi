import { useState } from "react";
import apiClient from '../../services/api';

/** Matches pricingEngine.ts's PaymentFrequency — the Excel model only supports these two;
 *  anything else silently falls back to an annual cashflow divisor. */
type PaymentFrequency = 'Quarterly' | 'Semi-Annual' | 'Annual';

/** Shape of the deal inputs as they come back from the API (subset relevant to this form). */
export interface DealInputs {
  cashflowStartDate?: string;
  cashflowExpiryDate?: string;
  pricingDate?: string;
  startingRent?: number;
  paymentFrequency?: PaymentFrequency;
  cap?: number; // decimal, e.g. 0.05 = 5%
  collar?: number; // decimal
  targetZSpread?: number; // decimal
  comparatorBondSpread?: number; // decimal
  purchaserCosts?: number; // decimal
  stabilisedNOI?: number;
  vpv?: number;
}

interface FormDataState {
  startDate: string;
  expiryDate: string;
  pricingDate: string;
  rent: number;
  paymentFrequency: PaymentFrequency | '';
  cap: number; // held as a whole percentage in the UI, e.g. 5 = 5%
  collar: number;
  spread: number; // Target Z-Spread, whole percentage
  comparatorBondSpread: number; // whole percentage
  purchaserCosts: number; // whole percentage
  noi: number;
  vpv: number;
}

interface InputDealModalProps {
  inputs: DealInputs | null;
  //setInputs: React.Dispatch<React.SetStateAction<DealInputs | null>>;
  dealId: string;
  onClose: () => void;
}

function InputDealModal({ inputs, dealId, onClose }: InputDealModalProps) {
  const [formData, setFormData] = useState<FormDataState>({
    startDate: inputs?.cashflowStartDate ?? '',
    expiryDate: inputs?.cashflowExpiryDate ?? '',
    pricingDate: inputs?.pricingDate ?? '',
    rent: inputs?.startingRent ?? 0,
    paymentFrequency: inputs?.paymentFrequency ?? '',
    cap: (inputs?.cap ?? 0) * 100,
    collar: (inputs?.collar ?? 0) * 100,
    spread: (inputs?.targetZSpread ?? 0) * 100,
    comparatorBondSpread: (inputs?.comparatorBondSpread ?? 0) * 100,
    purchaserCosts: (inputs?.purchaserCosts ?? 0) * 100,
    noi: inputs?.stabilisedNOI ?? 0,
    vpv: inputs?.vpv ?? 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      // numeric inputs come through as strings from the DOM — convert immediately so
      // formData never mixes string/number for the same field across renders
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  /** Basic sanity checks the pricing engine relies on — catches bad data before it's saved. */
  function validate(): string | null {
    if (!formData.startDate || !formData.expiryDate || !formData.pricingDate) {
      return 'All three dates are required.';
    }
    if (new Date(formData.expiryDate) <= new Date(formData.startDate)) {
      return 'Expiry Date must be after Start Date.';
    }
    if (!formData.paymentFrequency) {
      return 'Payment Frequency is required.';
    }
    if (formData.rent <= 0) {
      return 'Rent must be greater than 0.';
    }
    if (formData.vpv <= 0) {
      return 'VPV must be greater than 0.';
    }
    if (formData.noi < 0) {
      return 'Stabilised NOI cannot be negative.';
    }
    if (formData.cap < 0 || formData.cap > 100) {
      return 'Cap (%) must be between 0 and 100.';
    }
    if (formData.collar < 0 || formData.collar > formData.cap) {
      return 'Collar (%) must be between 0 and the Cap.';
    }
    if (formData.spread < 0) {
      return 'Target Z-Spread (%) cannot be negative.';
    }
    if (formData.comparatorBondSpread < 0) {
      return 'Comparator Bond Spread (%) cannot be negative.';
    }
    if (formData.purchaserCosts < 0 || formData.purchaserCosts > 100) {
      return 'Purchaser Cost (%) must be between 0 and 100.';
    }
    return null;
  }

  const handleSaveInputs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        startDate: new Date(formData.startDate),
        expiryDate: new Date(formData.expiryDate),
        pricingDate: new Date(formData.pricingDate),
        rent: Math.round(formData.rent),
        paymentFrequency: formData.paymentFrequency,
        // percentages entered as whole numbers in the UI (e.g. 5 = 5%) must be
        // converted back to decimals (0.05) — this was previously missing.
        cap: formData.cap,
        collar: formData.collar,
        spread: formData.spread,
        comparatorBondSpread: formData.comparatorBondSpread,
        purchaserCosts: formData.purchaserCosts,
        noi: formData.noi,
        vpv: formData.vpv,
      }
      console.log(payload);
      const response = await apiClient.put(`/deals/inputs/${dealId}`, payload);

      if (response.status !== 200) {
        throw new Error('Failed to save inputs');
      }

      // Hide the modal first, then reload — previously reload() ran first,
      // making the modal-hide code below it unreachable.
      const modalElement = document.getElementById('inputModal');
      if (modalElement) {
        // @ts-ignore
        const bootstrap = window.bootstrap;
        if (bootstrap) {
          const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
          modalInstance.hide();
        }
      }
      
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving inputs';
      console.error('Error saving inputs:', message);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1040,
        }}
        onClick={onClose}
      />

      <div
        className="modal fade show createdeal-modal"
        id="inputModal"
        tabIndex={-1}
        aria-hidden="false"
        style={{ display: 'block', zIndex: 1050, overflowY: 'auto' }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title">Financial Inputs</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <form onSubmit={handleSaveInputs}>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="row g-3">
                  <div className="form-group col-6">
                    <label className="form-label font-weight-bold">Start Date</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className="form-control"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label font-weight-bold">Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label font-weight-bold">Pricing Date</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className="form-control"
                      name="pricingDate"
                      value={formData.pricingDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label font-weight-bold">Rent</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      name="rent"
                      value={formData.rent}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label font-weight-bold">Payment Frequency</label>
                    <select
                      className="form-select"
                      name="paymentFrequency"
                      value={formData.paymentFrequency}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Frequency</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annual">Semi-Annual</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>

                  <div className="col-6">
                    <label className="form-label font-weight-bold">Cap (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      className="form-control"
                      name="cap"
                      value={formData.cap}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Collar (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      className="form-control"
                      name="collar"
                      value={formData.collar}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Target Z-Spread (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      name="spread"
                      value={formData.spread}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Comparator Bond Spread (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      name="comparatorBondSpread"
                      value={formData.comparatorBondSpread}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Purchaser Cost (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      className="form-control"
                      name="purchaserCosts"
                      value={formData.purchaserCosts.toFixed(2)}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Stabilised NOI</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="noi"
                      value={formData.noi}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">VPV</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="vpv"
                      value={formData.vpv}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {/* LTV removed: it's Gross Price / VPV, a computed OUTPUT of the pricing
                      model, not a value the user should enter — it can't be a valid input. */}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-info" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default InputDealModal;
