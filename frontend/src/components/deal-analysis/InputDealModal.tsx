import { useState } from "react";
import apiClient from '../../services/api';
interface InputDealModalProps {
  inputs: any;
  curve: any;
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  setCurves: React.Dispatch<React.SetStateAction<any>>;
  dealId: string;
}
function InputDealModal({ inputs, curve, setInputs, setCurves, dealId }: InputDealModalProps) {
    
    const [formData, setFormData] = useState({
        startDate: inputs.leaseStartDate,
        expiryDate: inputs.leaseExpiryDate,
        pricingDate: inputs.pricingDate,
        rent: inputs.initialAnnualRent,
        paymentFrequency: inputs.paymentFrequency,
        inflationLagMonths: inputs.inflationLagMonths,
        cap: inputs.cap * 100,
        collar: inputs.collar * 100,
        spread: Number(((inputs.targetZSpread ?? 0) * 100).toFixed(2)),
        loanAmount: inputs.loanAmount,
        purchaserCosts: inputs.purchaserCosts * 100,
        soniaCurve: Number(((curve?.soniaCurve?.[0]?.rate ?? 0.0377) * 100).toFixed(2)),
        inflationCurve: Number(((curve?.inflationCurve?.[0]?.rate ?? 0.031) * 100).toFixed(2)),
        giltCurve: Number(((curve?.giltCurve?.[0]?.rate ?? 0.042) * 100).toFixed(2)),
        noi: inputs.noi ?? 0,
        vpv: inputs.vpv ?? 0,
        ltv: inputs.ltv ?? 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInputs = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await apiClient.put(`/deals/inputs/${dealId}`, 
                {
                    startDate: new Date(formData.startDate),
                    expiryDate: new Date(formData.expiryDate),
                    pricingDate: new Date(formData.pricingDate),
                    rent: Math.round(formData.rent),
                    paymentFrequency: formData.paymentFrequency,
                    inflationLagMonths: formData.inflationLagMonths,
                    cap: formData.cap,
                    collar: formData.collar,
                    spread: formData.spread,
                    purchaserCosts: Number(formData.purchaserCosts),
                    soniaCurve: formData.soniaCurve / 100,
                    inflationCurve: formData.inflationCurve / 100,
                    giltCurve: formData.giltCurve / 100,
                    noi: formData.noi,
                    vpv: formData.vpv,
                    ltv: formData.ltv,
                }
            );
            

            if (response.status !== 200) {
                throw new Error('Failed to save inputs');
            }
           
            const result = response.data.data;
           
            window.location.reload();

            const modalElement = document.getElementById('inputModal'); 
            if (modalElement) {
                // @ts-ignore 
                const bootstrap = window.bootstrap;
                if (bootstrap) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                    modalInstance.hide();
                }
            }
        } catch (error: any) {
             
            console.error('Error saving inputs:', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <div className="modal fade createdeal-modal" id="inputModal" tabIndex={-1} aria-hidden="true">
    <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header bg-light">
                <h5 className="modal-title">Financial Inputs</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleSaveInputs}>
                <div className="modal-body">
                    <div className="row g-3">
                        <div className="form-group col-6">
                            <label className="form-label font-weight-bold">Start Date</label>
                            <input type="date" max={new Date().toISOString().split('T')[0]} className="form-control" name="startDate" value={formData.startDate} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label font-weight-bold">Expiry Date</label>
                            <input type="date" className="form-control" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label font-weight-bold">Pricing Date</label>
                            <input type="date" max={new Date().toISOString().split('T')[0]} className="form-control" name="pricingDate" value={formData.pricingDate} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label font-weight-bold">Rent</label>
                            <input type="number"  className="form-control" name="rent" value={formData.rent} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label font-weight-bold">Payment Frequency</label>
                            <select className="form-select" name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} required>
                                <option value="">Select Frequency</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Semi-Annually">Semi-Annually</option>
                                <option value="Annually">Annually</option>
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="form-label font-weight-bold">inflation Lag Months</label>
                            <input type="number"  className="form-control" name="inflationLagMonths" value={formData.inflationLagMonths} onChange={handleChange} required />
                        </div>
                        
                        <div className="col-6">
                            <label className="form-label font-weight-bold">Cap (%)</label>
                            <input type="number"  className="form-control" name="cap" value={formData.cap} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label">Collar (%)</label>
                            <input type="number" className="form-control" name="collar" value={formData.collar} onChange={handleChange} required />
                        </div>
                        <div className="col-6">
                            <label className="form-label">Target Z-Spread (%)</label>
                            <input type="number" className="form-control" name="spread" value={formData.spread} onChange={handleChange} required />
                        </div>
                         {/*}
                        <div className="col-6">
                            <label className="form-label">Rent (£)</label>
                            <input type="number" className="form-control" name="loanAmount" value={formData.loanAmount} onChange={handleChange} required />
                        </div>
                             {*/}
                        <div className="col-6">
                            <label className="form-label">Purchaser Cost (%)</label>
                            <input type="number" className="form-control" name="purchaserCosts" value={formData.purchaserCosts.toFixed(2)} onChange={handleChange} required />
                        </div>

                        <div className="col-6">
                            <label className="form-label">Stabilised NOI</label>
                            <input type="number" className="form-control" name="noi" value={formData.noi} onChange={handleChange} required />
                        </div>

                        <div className="col-6">
                            <label className="form-label">VPF </label>
                            <input type="number" className="form-control" name="vpv" value={formData.vpv} onChange={handleChange} required />
                        </div>

                        <div className="col-6">
                            <label className="form-label">LTV (%)</label>
                            <input type="number" className="form-control" name="ltv" value={formData.ltv} onChange={handleChange} required />
                        </div>
                        {/*}
                        <div className="col-6">
                            <label className="form-label">sonia (%)</label>
                            <input type="number" className="form-control" name="soniaCurve" value={formData.soniaCurve} onChange={handleChange} required />
                        </div>

                        <div className="col-6">
                            <label className="form-label">giltCurve (%)</label>
                            <input type="number" className="form-control" name="giltCurve" value={formData.giltCurve} onChange={handleChange} required />
                        </div>

                        <div className="col-6">
                            <label className="form-label">inflationCurve (%)</label>
                            <input type="number" className="form-control" name="inflationCurve" value={formData.inflationCurve} onChange={handleChange} required />
                        </div>
                        {*/}

                    </div>
                </div>
                <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-info" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Submit"}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
  );
}

export default InputDealModal;