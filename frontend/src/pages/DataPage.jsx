import { useState, useEffect, useRef } from "react";
import { Upload, Database, FileSpreadsheet, AlertCircle, FlaskConical, Beaker } from "lucide-react";
import { fetchFeedstocks, uploadFeedstock, uploadBaseline, fetchBaselineList } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OMEGA_OPTIONS = [5, 10, 15, 20, 25];

export default function DataPage() {
  const [feedstocks, setFeedstocks] = useState([]);
  const [baselines, setBaselines] = useState([]);

  // ERW Results upload state
  const [erwName, setErwName] = useState("");
  const [omega, setOmega] = useState("5");
  const [erwFile, setErwFile] = useState(null);
  const [erwUploading, setErwUploading] = useState(false);
  const erwFileRef = useRef(null);

  // Baseline upload state
  const [baselineName, setBaselineName] = useState("");
  const [baselineFile, setBaselineFile] = useState(null);
  const [baselineUploading, setBaselineUploading] = useState(false);
  const baselineFileRef = useRef(null);

  const loadFeedstocks = () =>
    fetchFeedstocks().then(d => setFeedstocks(d || [])).catch(() => {});
  const loadBaselines = () =>
    fetchBaselineList().then(d => setBaselines(d || [])).catch(() => {});

  useEffect(() => {
    loadFeedstocks();
    loadBaselines();
  }, []);

  const handleErwUpload = async () => {
    if (!erwFile || !erwName.trim()) {
      toast.error("Provide a feedstock name and ERW Results file");
      return;
    }
    setErwUploading(true);
    try {
      const res = await uploadFeedstock(erwFile, erwName.trim(), parseInt(omega));
      toast.success(`Uploaded ${res.samples_count} ERW samples for "${erwName}"`);
      setErwFile(null);
      setErwName("");
      if (erwFileRef.current) erwFileRef.current.value = "";
      loadFeedstocks();
    } catch (e) {
      toast.error("Upload failed: " + (e.response?.data?.detail || e.message));
    }
    setErwUploading(false);
  };

  const handleBaselineUpload = async () => {
    if (!baselineFile || !baselineName.trim()) {
      toast.error("Provide a dataset name and Baseline file");
      return;
    }
    setBaselineUploading(true);
    try {
      const res = await uploadBaseline(baselineFile, baselineName.trim());
      toast.success(`Uploaded ${res.samples_count} baseline samples for "${baselineName}"`);
      setBaselineFile(null);
      setBaselineName("");
      if (baselineFileRef.current) baselineFileRef.current.value = "";
      loadBaselines();
    } catch (e) {
      toast.error("Upload failed: " + (e.response?.data?.detail || e.message));
    }
    setBaselineUploading(false);
  };

  return (
    <div className="space-y-8" data-testid="data-page">
      <div className="anim-fade-up">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Data</h1>
        <p className="text-base text-gray-400 mt-2">Upload baseline water chemistry or ERW simulation results</p>
      </div>

      {/* Upload Tabs */}
      <div className="anim-fade-up delay-1">
        <Tabs defaultValue="erw-results">
          <TabsList className="bg-gray-100/80 p-1 rounded-full inline-flex mb-6">
            <TabsTrigger value="erw-results" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> ERW Results
            </TabsTrigger>
            <TabsTrigger value="baseline" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5" /> Baseline Data
            </TabsTrigger>
          </TabsList>

          {/* ── ERW Results Upload ── */}
          <TabsContent value="erw-results">
            <div className="bg-white rounded-xl border border-gray-100 p-6" data-testid="upload-section">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                <Upload className="w-4 h-4 text-emerald-600" /> Upload ERW Results Dataset
              </h3>
              <p className="text-xs text-gray-400 mb-5">
                Excel file (.xlsx) with an <strong>"ERW Results"</strong> sheet containing simulation output. Data starts at row 4.
                Optionally include a <strong>"Summary Statistics"</strong> sheet.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Feedstock Name</label>
                  <input
                    type="text" value={erwName} onChange={e => setErwName(e.target.value)}
                    placeholder="e.g. calcite, wollastonite"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    data-testid="feedstock-name-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Omega Threshold</label>
                  <Select value={omega} onValueChange={setOmega}>
                    <SelectTrigger className="w-full h-10 text-sm rounded-lg" data-testid="upload-omega-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OMEGA_OPTIONS.map(o => <SelectItem key={o} value={String(o)}>Ω = {o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Excel File (.xlsx)</label>
                  <input
                    ref={erwFileRef} type="file" accept=".xlsx,.xls"
                    onChange={e => setErwFile(e.target.files?.[0])}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    data-testid="file-input"
                  />
                </div>
              </div>
              <button
                onClick={handleErwUpload}
                disabled={erwUploading || !erwFile || !erwName.trim()}
                data-testid="upload-btn"
                className="mt-5 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all active:scale-95"
              >
                {erwUploading ? "Uploading..." : "Upload ERW Results"}
              </button>
            </div>

            {/* ERW Results Table */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4" data-testid="feedstocks-table">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                <Database className="w-4 h-4 text-emerald-600" /> ERW Feedstocks
              </h3>
              {feedstocks.length === 0
                ? <p className="text-sm text-gray-300 py-6 text-center">No ERW datasets uploaded yet.</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {["Feedstock", "Omega Thresholds", "Samples", "Created"].map(h => (
                          <TableHead key={h} className="text-[10px] font-mono uppercase tracking-wider">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedstocks.map((f, i) => (
                        <TableRow key={i} className="hover:bg-gray-50/50">
                          <TableCell className="text-sm font-medium flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-gray-300" />
                            {f.name?.charAt(0).toUpperCase() + f.name?.slice(1)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(f.omega_thresholds || []).map(o => (
                                <Badge key={o} variant="secondary" className="font-mono text-[10px]">Ω={o}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{f.sample_count?.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              }
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-4" data-testid="upload-info">
              <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> Expected ERW Results Format
              </h4>
              <ul className="text-xs text-emerald-800 space-y-1 ml-6 list-disc">
                <li>Excel (.xlsx) with an <strong>"ERW Results"</strong> sheet (or active sheet)</li>
                <li>Row 3: Column headers — Data starts from row 4</li>
                <li>Columns: Sample No, River Type, Lat, Lon, pH, Alkalinity … CDR (t/yr), CDR (kt/yr)</li>
                <li>Optional: <strong>"Summary Statistics"</strong> sheet for regional aggregates</li>
                <li>Omega threshold: 5, 10, 15, 20, or 25</li>
              </ul>
            </div>
          </TabsContent>

          {/* ── Baseline Upload ── */}
          <TabsContent value="baseline">
            <div className="bg-white rounded-xl border border-gray-100 p-6" data-testid="baseline-upload-section">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                <Upload className="w-4 h-4 text-blue-600" /> Upload Baseline Water Chemistry
              </h3>
              <p className="text-xs text-gray-400 mb-5">
                Excel file (.xlsx) with pre-ERW water chemistry measurements. Use a <strong>"Baseline"</strong> sheet or the
                first sheet. Data starts at row 4.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Dataset Name</label>
                  <input
                    type="text" value={baselineName} onChange={e => setBaselineName(e.target.value)}
                    placeholder="e.g. baseline-2024, pre-treatment"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    data-testid="baseline-name-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Excel File (.xlsx)</label>
                  <input
                    ref={baselineFileRef} type="file" accept=".xlsx,.xls"
                    onChange={e => setBaselineFile(e.target.files?.[0])}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    data-testid="baseline-file-input"
                  />
                </div>
              </div>
              <button
                onClick={handleBaselineUpload}
                disabled={baselineUploading || !baselineFile || !baselineName.trim()}
                data-testid="baseline-upload-btn"
                className="mt-5 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95"
              >
                {baselineUploading ? "Uploading..." : "Upload Baseline"}
              </button>
            </div>

            {/* Baseline Datasets Table */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4" data-testid="baselines-table">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                <Database className="w-4 h-4 text-blue-600" /> Baseline Datasets
              </h3>
              {baselines.length === 0
                ? <p className="text-sm text-gray-300 py-6 text-center">No baseline datasets uploaded yet.</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {["Dataset", "Samples", "Last Updated"].map(h => (
                          <TableHead key={h} className="text-[10px] font-mono uppercase tracking-wider">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {baselines.map((b, i) => (
                        <TableRow key={i} className="hover:bg-gray-50/50">
                          <TableCell className="text-sm font-medium flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-gray-300" />
                            {b.dataset_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{b.count?.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {b.uploaded_at ? new Date(b.uploaded_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              }
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-4">
              <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> Expected Baseline Format
              </h4>
              <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
                <li>Excel (.xlsx) with a <strong>"Baseline"</strong> sheet (or any active sheet)</li>
                <li>Row 3: Column headers — Data starts from row 4</li>
                <li>Columns: Sample No, River Type, Lat, Lon, pH, Alkalinity, Temp, Ca, Mg, Na, K, Cl, SO4, NO3 …</li>
                <li>State, Region, River Name, Discharge, Source in later columns</li>
                <li>ERW-computed fields (CDR, omega_final, etc.) are not required</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
