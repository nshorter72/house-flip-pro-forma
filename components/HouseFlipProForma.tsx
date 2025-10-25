import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Home, DollarSign, TrendingUp, Calendar, AlertCircle, Hammer, Plus, Trash2 } from 'lucide-react';

const HouseFlipProForma = () => {
  const [inputs, setInputs] = useState({
    projectName: 'Terrace Way',
    purchasePrice: 432910,
    arvPrice: 600000,
    holdPeriodWeeks: 36,
    purchaseClosingCosts: 4329,
    saleClosingCostsPct: 6,
    propertyTaxesAnnual: 4500,
    insuranceAnnual: 4500,
    utilitiesMonthly: 200,
    hoaMonthly: 0,
    contingencyPct: 10
  });

  const [renovationItems, setRenovationItems] = useState([
    {
      id: 1,
      category: 'Flooring',
      materials: [
        { name: 'Tiles', cost: 3500 },
        { name: 'Underlayment', cost: 800 }
      ],
      labor: 5300,
      notes: '1,200 sq ft'
    },
    {
      id: 2,
      category: 'Paint',
      materials: [
        { name: 'Interior Paint', cost: 2800 },
        { name: 'Primer', cost: 600 }
      ],
      labor: 4200,
      notes: 'Entire interior'
    },
    {
      id: 3,
      category: 'Kitchen',
      materials: [
        { name: 'Cabinets', cost: 6500 },
        { name: 'Countertops', cost: 3200 }
      ],
      labor: 1700,
      notes: 'Full remodel'
    },
    {
      id: 4,
      category: 'Bathroom',
      materials: [
        { name: 'Vanity', cost: 1200 },
        { name: 'Toilet', cost: 400 }
      ],
      labor: 800,
      notes: '2 bathrooms'
    }
  ]);

  const [financingSources, setFinancingSources] = useState([
    {
      id: 1,
      name: 'Senior Mortgage',
      type: 'ltv',
      ltvPct: 75,
      fixedAmount: 0,
      interestRate: 7.5,
      originationPct: 1,
      enabled: true
    },
    {
      id: 2,
      name: 'Hard Money',
      type: 'fixed',
      ltvPct: 0,
      fixedAmount: 40000,
      interestRate: 12,
      originationPct: 2,
      enabled: true
    }
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRenovationTab, setActiveRenovationTab] = useState<string | number>('summary');
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectAction, setProjectAction] = useState('save');

  // Load projects on mount
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await window.storage.list('project:');
        if (result && result.keys) {
          const projects = [];
          for (const key of result.keys) {
            try {
              const data = await window.storage.get(key);
              if (data && data.value) {
                const project = JSON.parse(data.value);
                projects.push(project);
              }
            } catch (e) {
              console.log('Error loading project:', key);
            }
          }
          setSavedProjects(projects);
        }
      } catch (error) {
        console.log('No saved projects yet');
      }
    };
    loadProjects();
  }, []);

  const calculations = useMemo(() => {
    const calc = (inputSet, renovItems, finSources) => {
      const baseRenovation = renovItems.reduce((sum, item) => {
        const materialsTotal = item.materials.reduce((s, m) => s + m.cost, 0);
        return sum + materialsTotal + item.labor;
      }, 0);
      
      const contingency = baseRenovation * (inputSet.contingencyPct / 100);
      const totalRenovation = baseRenovation + contingency;
      
      const holdMonths = inputSet.holdPeriodWeeks / 4.33;
      const propertyTaxes = (inputSet.propertyTaxesAnnual / 12) * holdMonths;
      const insurance = (inputSet.insuranceAnnual / 12) * holdMonths;
      const utilities = inputSet.utilitiesMonthly * holdMonths;
      const hoa = inputSet.hoaMonthly * holdMonths;
      const totalHoldingCosts = propertyTaxes + insurance + utilities + hoa;
      
      const financingDetails = finSources.filter(s => s.enabled).map(source => {
        let loanAmount = 0;
        if (source.type === 'ltv') {
          loanAmount = inputSet.purchasePrice * (source.ltvPct / 100);
        } else {
          loanAmount = source.fixedAmount;
        }
        
        const origination = loanAmount * (source.originationPct / 100);
        const interest = loanAmount * (source.interestRate / 100) * (holdMonths / 12);
        
        return {
          name: source.name,
          loanAmount,
          origination,
          interest,
          total: origination + interest
        };
      });
      
      const totalLoanAmount = financingDetails.reduce((sum, f) => sum + f.loanAmount, 0);
      const totalFinancingCosts = financingDetails.reduce((sum, f) => sum + f.total, 0);
      
      const totalCosts = inputSet.purchasePrice + inputSet.purchaseClosingCosts + totalRenovation + totalHoldingCosts + totalFinancingCosts;
      
      const saleClosingCosts = inputSet.arvPrice * (inputSet.saleClosingCostsPct / 100);
      const netSaleProceeds = inputSet.arvPrice - saleClosingCosts;
      const netProfit = netSaleProceeds - totalCosts;
      const totalEquity = totalCosts - totalLoanAmount;
      const roi = (netProfit / totalEquity) * 100;
      const years = holdMonths / 12;
      const irr = ((Math.pow(1 + (roi / 100), 1 / years) - 1) * 100);
      
      return {
        totalRenovation,
        baseRenovation,
        contingency,
        totalHoldingCosts,
        financingDetails,
        totalLoanAmount,
        totalFinancingCosts,
        totalCosts,
        netSaleProceeds,
        saleClosingCosts,
        netProfit,
        totalEquity,
        roi,
        irr,
        holdMonths
      };
    };

    return {
      base: calc(inputs, renovationItems, financingSources)
    };
  }, [inputs, renovationItems, financingSources]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return value.toFixed(1) + '%';
  };

  const updateInput = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const updateFinancingSource = (id, field, value) => {
    setFinancingSources(prev => prev.map(source => {
      if (source.id === id) {
        if (field === 'enabled') {
          return { ...source, enabled: value };
        } else if (field === 'name') {
          return { ...source, name: value };
        } else if (field === 'type') {
          return { ...source, type: value };
        } else {
          return { ...source, [field]: parseFloat(value) || 0 };
        }
      }
      return source;
    }));
  };

  const addFinancingSource = () => {
    const newId = Math.max(...financingSources.map(f => f.id), 0) + 1;
    setFinancingSources(prev => [...prev, {
      id: newId,
      name: 'New Financing',
      type: 'fixed',
      ltvPct: 0,
      fixedAmount: 0,
      interestRate: 8,
      originationPct: 1,
      enabled: true
    }]);
  };

  const updateRenovationItem = (id, field, subfield, value) => {
    setRenovationItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'materials') {
          return {
            ...item,
            materials: item.materials.map((m, idx) => 
              idx === subfield ? { ...m, cost: parseFloat(value) || 0 } : m
            )
          };
        } else if (field === 'materialName') {
          return {
            ...item,
            materials: item.materials.map((m, idx) => 
              idx === subfield ? { ...m, name: value } : m
            )
          };
        } else if (field === 'labor') {
          return { ...item, labor: parseFloat(value) || 0 };
        } else if (field === 'notes') {
          return { ...item, notes: value };
        }
      }
      return item;
    }));
  };

  const addMaterialToItem = (itemId) => {
    setRenovationItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          materials: [...item.materials, { name: 'New Material', cost: 0 }]
        };
      }
      return item;
    }));
  };

  const removeMaterialFromItem = (itemId, materialIdx) => {
    setRenovationItems(prev => prev.map(item => {
      if (item.id === itemId && item.materials.length > 1) {
        return {
          ...item,
          materials: item.materials.filter((_, idx) => idx !== materialIdx)
        };
      }
      return item;
    }));
  };

  // Storage helpers that prefer window.storage but fall back to a single 'houseFlipProjects' array in localStorage
  const storageSet = async (id: string, value: string) => {
    if ((window as any).storage?.set) return (window as any).storage.set(id, value);

    const raw = localStorage.getItem('houseFlipProjects') || '[]';
    const projects = JSON.parse(raw);
    let projectObj;
    try {
      projectObj = JSON.parse(value);
    } catch {
      // if value isn't JSON, wrap it
      projectObj = { id, value };
    }
    const idx = projects.findIndex((p: any) => p.id === id);
    if (idx >= 0) {
      projects[idx] = projectObj;
    } else {
      projects.push(projectObj);
    }
    localStorage.setItem('houseFlipProjects', JSON.stringify(projects));
  };

  const storageGet = async (id: string) => {
    if ((window as any).storage?.get) return (window as any).storage.get(id);

    const raw = localStorage.getItem('houseFlipProjects') || '[]';
    const projects = JSON.parse(raw);
    const project = projects.find((p: any) => p.id === id);
    return { value: project ? JSON.stringify(project) : null };
  };

  const storageList = async () => {
    if ((window as any).storage?.list) return (window as any).storage.list('houseFlipProjects');
    const raw = localStorage.getItem('houseFlipProjects') || '[]';
    const projects = JSON.parse(raw);
    const keys = projects.map((p: any) => p.id);
    return { keys };
  };

  const storageRemove = async (id: string) => {
    if ((window as any).storage?.remove) return (window as any).storage.remove(id);

    const raw = localStorage.getItem('houseFlipProjects') || '[]';
    let projects = JSON.parse(raw);
    projects = projects.filter((p: any) => p.id !== id);
    localStorage.setItem('houseFlipProjects', JSON.stringify(projects));
  };

  const generateId = () => `project_${Date.now()}`;

  const refreshSavedProjects = async () => {
    try {
      const result = await storageList();
      const projects = [];
      for (const key of result.keys) {
        try {
          const data = await storageGet(key);
          if (data && data.value) {
            projects.push(JSON.parse(data.value));
          }
        } catch (e) {
          console.log('Error loading project:', key);
        }
      }
      setSavedProjects(projects);
    } catch (e) {
      console.log('No saved projects yet');
    }
  };

  const saveProject = async () => {
    try {
      const id = currentProjectId || generateId();
      const project = {
        id,
        projectName: inputs.projectName,
        inputs,
        renovationItems,
        financingSources,
        savedAt: new Date().toISOString()
      };
      await storageSet(id, JSON.stringify(project));
      setCurrentProjectId(id);
      await refreshSavedProjects();
      alert('Project saved');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    }
  };

  const saveProjectAs = async (name: string) => {
    try {
      setInputs(prev => ({ ...prev, projectName: name }));
      const id = `project:${name.replace(/\s+/g,'-').toLowerCase()}:${Date.now()}`;
      const project = {
        id,
        projectName: name,
        inputs,
        renovationItems,
        financingSources,
        savedAt: new Date().toISOString()
      };
      await storageSet(id, JSON.stringify(project));
      setCurrentProjectId(id);
      await refreshSavedProjects();
      alert('Project saved as ' + name);
    } catch (e) {
      console.error(e);
      alert('Save as failed');
    }
  };

  const loadProject = async (id: string) => {
    try {
      const data = await storageGet(id);
      if (data && data.value) {
        const project = JSON.parse(data.value);
        if (project.inputs) setInputs(project.inputs);
        if (project.renovationItems) setRenovationItems(project.renovationItems);
        if (project.financingSources) setFinancingSources(project.financingSources);
        setCurrentProjectId(id);
      } else {
        alert('Project not found');
      }
    } catch (e) {
      console.error(e);
      alert('Load failed');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await storageRemove(id);
      await refreshSavedProjects();
      setCurrentProjectId(null);
      alert('Deleted');
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const exportProject = () => {
    try {
      const project = {
        projectName: inputs.projectName,
        inputs,
        renovationItems,
        financingSources,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(inputs.projectName || 'project').replace(/\s+/g,'-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  const handleImportFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = ev.target?.result as string;
        const project = JSON.parse(content);
        if (project.inputs) setInputs(project.inputs);
        if (project.renovationItems) setRenovationItems(project.renovationItems);
        if (project.financingSources) setFinancingSources(project.financingSources);
        // auto-save imported project
        const id = `project:imported:${Date.now()}`;
        await storageSet(id, JSON.stringify({ id, ...project, importedAt: new Date().toISOString() }));
        await refreshSavedProjects();
        setCurrentProjectId(id);
        alert('Imported and saved');
      } catch (err) {
        console.error(err);
        alert('Import failed');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{inputs.projectName}</h1>
              <p className="text-gray-600 mt-1">Enhanced House Flip Pro Forma</p>
            </div>
            <Home className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={'flex items-center px-6 py-4 font-medium transition-colors ' + (activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900')}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('inputs')}
              className={'flex items-center px-6 py-4 font-medium transition-colors ' + (activeTab === 'inputs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900')}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Inputs
            </button>
            <button
              onClick={() => setActiveTab('renovation')}
              className={'flex items-center px-6 py-4 font-medium transition-colors ' + (activeTab === 'renovation' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900')}
            >
              <Hammer className="w-5 h-5 mr-2" />
              Renovation
            </button>
            <button
              onClick={() => setActiveTab('financing')}
              className={'flex items-center px-6 py-4 font-medium transition-colors ' + (activeTab === 'financing' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900')}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Financing
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Net Profit</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(calculations.base.netProfit)}</div>
                <div className="text-sm opacity-90 mt-1">{formatPercent(calculations.base.roi)} ROI</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">IRR</span>
                </div>
                <div className="text-3xl font-bold">{formatPercent(calculations.base.irr)}</div>
                <div className="text-sm opacity-90 mt-1">Annualized</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Home className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Equity</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(calculations.base.totalEquity)}</div>
                <div className="text-sm opacity-90 mt-1">Required</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Timeline</span>
                </div>
                <div className="text-3xl font-bold">{inputs.holdPeriodWeeks}</div>
                <div className="text-sm opacity-90 mt-1">Weeks</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-semibold">{formatCurrency(inputs.purchasePrice)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Renovation:</span>
                  <span className="font-semibold">{formatCurrency(calculations.base.totalRenovation)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Holding Costs:</span>
                  <span className="font-semibold">{formatCurrency(calculations.base.totalHoldingCosts)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Financing Costs:</span>
                  <span className="font-semibold">{formatCurrency(calculations.base.totalFinancingCosts)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total Project Cost:</span>
                  <span className="font-semibold">{formatCurrency(calculations.base.totalCosts)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">ARV (Sale Price):</span>
                  <span className="font-semibold">{formatCurrency(inputs.arvPrice)}</span>
                </div>
                <div className="flex justify-between py-2 bg-green-50">
                  <span className="text-gray-800 font-medium">Net Profit:</span>
                  <span className="font-bold text-green-600">{formatCurrency(calculations.base.netProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={inputs.projectName}
                    onChange={(e) => setInputs(prev => ({ ...prev, projectName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    value={inputs.purchasePrice}
                    onChange={(e) => updateInput('purchasePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ARV</label>
                  <input
                    type="number"
                    value={inputs.arvPrice}
                    onChange={(e) => updateInput('arvPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hold Period (Weeks)</label>
                  <input
                    type="number"
                    value={inputs.holdPeriodWeeks}
                    onChange={(e) => updateInput('holdPeriodWeeks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Holding Costs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Taxes (Annual)</label>
                  <input
                    type="number"
                    value={inputs.propertyTaxesAnnual}
                    onChange={(e) => updateInput('propertyTaxesAnnual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance (Annual)</label>
                  <input
                    type="number"
                    value={inputs.insuranceAnnual}
                    onChange={(e) => updateInput('insuranceAnnual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilities (Monthly)</label>
                  <input
                    type="number"
                    value={inputs.utilitiesMonthly}
                    onChange={(e) => updateInput('utilitiesMonthly', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'renovation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex space-x-2 overflow-x-auto">
                <button
                  onClick={() => setActiveRenovationTab('summary')}
                  className={'px-4 py-2 rounded-md font-medium ' + (activeRenovationTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}
                >
                  Summary
                </button>
                {renovationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveRenovationTab(item.id)}
                    className={'px-4 py-2 rounded-md font-medium whitespace-nowrap ' + (activeRenovationTab === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}
                  >
                    {item.category}
                  </button>
                ))}
              </div>
            </div>

            {activeRenovationTab === 'summary' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Renovation Budget Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-right">Materials</th>
                        <th className="px-4 py-3 text-right">Labor</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renovationItems.map(item => {
                        const materialsTotal = item.materials.reduce((sum, m) => sum + m.cost, 0);
                        const itemTotal = materialsTotal + item.labor;
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="px-4 py-3">{item.category}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(materialsTotal)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.labor)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(itemTotal)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-100 font-bold">
                        <td className="px-4 py-3" colSpan={3}>Total</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(calculations.base.totalRenovation)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {renovationItems.map(item => (
              activeRenovationTab === item.id && (
                <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">{item.category} - Details</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Materials</h4>
                      <button
                        onClick={() => addMaterialToItem(item.id)}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {item.materials.map((material, idx) => (
                        <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                          <input
                            type="text"
                            value={material.name}
                            onChange={(e) => updateRenovationItem(item.id, 'materialName', idx, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <input
                            type="number"
                            value={material.cost}
                            onChange={(e) => updateRenovationItem(item.id, 'materials', idx, e.target.value)}
                            className="w-32 px-3 py-2 border rounded-md"
                          />
                          {item.materials.length > 1 && (
                            <button
                              onClick={() => removeMaterialFromItem(item.id, idx)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Labor</h4>
                    <input
                      type="number"
                      value={item.labor}
                      onChange={(e) => updateRenovationItem(item.id, 'labor', null, e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="bg-blue-100 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {formatCurrency(item.materials.reduce((sum, m) => sum + m.cost, 0) + item.labor)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {activeTab === 'financing' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Financing Sources</h3>
              <button
                onClick={addFinancingSource}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Source
              </button>
            </div>
            
            <div className="space-y-4">
              {financingSources.map((source) => (
                <div key={source.id} className={'border rounded-lg p-4 ' + (source.enabled ? 'bg-blue-50' : 'bg-gray-50')}>
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={(e) => updateFinancingSource(source.id, 'enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <input
                      type="text"
                      value={source.name}
                      onChange={(e) => updateFinancingSource(source.id, 'name', e.target.value)}
                      className="font-semibold bg-transparent border-b border-gray-300"
                    />
                  </div>

                  {source.enabled && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Type</label>
                        <select
                          value={source.type}
                          onChange={(e) => updateFinancingSource(source.id, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded-md"
                        >
                          <option value="ltv">LTV %</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>

                      {source.type === 'ltv' ? (
                        <div>
                          <label className="block text-xs font-medium mb-1">LTV %</label>
                          <input
                            type="number"
                            value={source.ltvPct}
                            onChange={(e) => updateFinancingSource(source.id, 'ltvPct', e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded-md"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium mb-1">Amount</label>
                          <input
                            type="number"
                            value={source.fixedAmount}
                            onChange={(e) => updateFinancingSource(source.id, 'fixedAmount', e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded-md"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium mb-1">Interest Rate %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={source.interestRate}
                          onChange={(e) => updateFinancingSource(source.id, 'interestRate', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Origination %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={source.originationPct}
                          onChange={(e) => updateFinancingSource(source.id, 'originationPct', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {source.enabled && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Loan: </span>
                        <span className="font-semibold">
                          {formatCurrency(
                            calculations.base.financingDetails.find(f => f.name === source.name)?.loanAmount || 0
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interest: </span>
                        <span className="font-semibold">
                          {formatCurrency(
                            calculations.base.financingDetails.find(f => f.name === source.name)?.interest || 0
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Cost: </span>
                        <span className="font-semibold">
                          {formatCurrency(
                            calculations.base.financingDetails.find(f => f.name === source.name)?.total || 0
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Loans</div>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(calculations.base.totalLoanAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Financing Costs</div>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(calculations.base.totalFinancingCosts)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Enhanced House Flip Pro Forma v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default HouseFlipProForma;
