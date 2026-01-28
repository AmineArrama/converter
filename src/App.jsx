import {useState, useEffect} from "react";
import "./App.css";
import currenciesData from "./currencies.json";
import translations from "./translations.json";

function App() {
  const [amount, setAmount] = useState(100);
  const [amountInput, setAmountInput] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [madAmount, setMadAmount] = useState(0);
  const [centimeAmount, setCentimeAmount] = useState(0);
  const [francAmount, setFrancAmount] = useState(0);
  const [madInput, setMadInput] = useState("0");
  const [centimeInput, setCentimeInput] = useState("0");
  const [francInput, setFrancInput] = useState("0");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [error, setError] = useState(null);
  const [customCurrencies, setCustomCurrencies] = useState({});
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [lastEditedField, setLastEditedField] = useState("source");

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const getDir = () => {
    return language === "ar" ? "rtl" : "ltr";
  };

  // Fetch available currencies on component mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        // Load custom currencies from JSON
        setCustomCurrencies(currenciesData.customCurrencies);

        const response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD",
        );
        const data = await response.json();
        const currencyList = Object.keys(data.rates).sort();
        const preferred = ["EUR", "USD"];
        const prioritized = [
          ...preferred.filter((code) => currencyList.includes(code)),
          ...currencyList.filter((code) => !preferred.includes(code)),
        ];
        setCurrencies(prioritized);
      } catch (err) {
        console.error("Error fetching currencies:", err);
        // Fallback list of common currencies
        const fallbackCurrencies = [
          "EUR",
          "USD",
          "GBP",
          "JPY",
          "CAD",
          "AUD",
          "CHF",
          "CNY",
          "SEK",
          "NZD",
          "MXN",
          "SGD",
          "HKD",
          "INR",
          "BRL",
          "MAD",
        ];
        setCurrencies(fallbackCurrencies);
      }
    };
    fetchCurrencies();
  }, []);

  const normalizeNumber = (value) => {
    const normalized = value.replace(/,/g, ".").replace(/\s+/g, "").trim();
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "";
    }
    return value.toString();
  };

  // Fetch conversion rate when amount or currency changes
  useEffect(() => {
    if (amount && fromCurrency && lastEditedField === "source") {
      convertCurrency();
    }
  }, [amount, fromCurrency]);

  const convertCurrency = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if it's a custom currency
      if (customCurrencies[fromCurrency]) {
        // Handle custom currency conversion
        const customCurr = customCurrencies[fromCurrency];
        const mad = amount * customCurr.toMAD;
        const rate = customCurr.toMAD;
        const madRounded = parseFloat(mad.toFixed(2));
        const centimeRounded = parseFloat((mad * 20).toFixed(2));
        const francRounded = parseFloat((mad * 100).toFixed(2));
        setMadAmount(madRounded);
        setCentimeAmount(centimeRounded);
        setFrancAmount(francRounded);
        setMadInput(formatNumber(madRounded));
        setCentimeInput(formatNumber(centimeRounded));
        setFrancInput(formatNumber(francRounded));
        setExchangeRate(parseFloat(rate.toFixed(4)));
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      );
      const data = await response.json();

      if (data.rates && data.rates.MAD) {
        const rate = data.rates.MAD;
        const mad = amount * rate;
        const madRounded = parseFloat(mad.toFixed(2));
        const centimeRounded = parseFloat((mad * 20).toFixed(2));
        const francRounded = parseFloat((mad * 100).toFixed(2));
        setMadAmount(madRounded);
        setCentimeAmount(centimeRounded);
        setFrancAmount(francRounded);
        setMadInput(formatNumber(madRounded));
        setCentimeInput(formatNumber(centimeRounded));
        setFrancInput(formatNumber(francRounded));
        setExchangeRate(parseFloat(rate.toFixed(4)));
      } else {
        setError(t("couldNotFetchRate"));
      }
    } catch (err) {
      setError(t("errorFetching").replace("{error}", err.message));
      console.error("Conversion error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceAmountChange = (e) => {
    const inputValue = e.target.value;
    setAmountInput(inputValue);
    setLastEditedField("source");

    const parsed = normalizeNumber(inputValue);
    if (parsed !== null && parsed >= 0) {
      setAmount(parsed);
    } else if (inputValue.trim() === "") {
      setAmount(0);
      setMadAmount(0);
      setCentimeAmount(0);
      setFrancAmount(0);
      setMadInput("");
      setCentimeInput("");
      setFrancInput("");
    }
  };

  const handleSourceAmountBlur = () => {
    const parsed = normalizeNumber(amountInput);
    if (parsed === null || parsed < 0) {
      setAmountInput(formatNumber(amount));
      return;
    }
    setAmountInput(formatNumber(parsed));
  };

  const handleMadAmountChange = (e) => {
    const inputValue = e.target.value;
    setMadInput(inputValue);
    setLastEditedField("mad");

    const value = normalizeNumber(inputValue);
    if (value !== null && value >= 0) {
      const madRounded = parseFloat(value.toFixed(2));
      const centimeRounded = parseFloat((madRounded * 20).toFixed(2));
      const francRounded = parseFloat((madRounded * 100).toFixed(2));
      setMadAmount(madRounded);
      setCentimeAmount(centimeRounded);
      setFrancAmount(francRounded);
      setCentimeInput(formatNumber(centimeRounded));
      setFrancInput(formatNumber(francRounded));

      if (exchangeRate && exchangeRate > 0) {
        const sourceAmount = parseFloat((madRounded / exchangeRate).toFixed(2));
        setAmount(sourceAmount);
        setAmountInput(formatNumber(sourceAmount));
      }
    } else if (inputValue.trim() === "") {
      setAmount(0);
      setMadAmount(0);
      setCentimeAmount(0);
      setFrancAmount(0);
      setAmountInput("");
      setCentimeInput("");
      setFrancInput("");
    }
  };

  const handleMadAmountBlur = () => {
    const value = normalizeNumber(madInput);
    if (value === null || value < 0) {
      setMadInput(formatNumber(madAmount));
      return;
    }
    setMadInput(formatNumber(parseFloat(value.toFixed(2))));
  };

  const handleCentimeAmountChange = (e) => {
    const inputValue = e.target.value;
    setCentimeInput(inputValue);
    setLastEditedField("centime");

    const value = normalizeNumber(inputValue);
    if (value !== null && value >= 0) {
      const mad = value / 20;
      const madRounded = parseFloat(mad.toFixed(2));
      const centimeRounded = parseFloat(value.toFixed(2));
      const francRounded = parseFloat((madRounded * 100).toFixed(2));
      setMadAmount(madRounded);
      setCentimeAmount(centimeRounded);
      setFrancAmount(francRounded);
      setMadInput(formatNumber(madRounded));
      setFrancInput(formatNumber(francRounded));

      if (exchangeRate && exchangeRate > 0) {
        const sourceAmount = parseFloat((madRounded / exchangeRate).toFixed(2));
        setAmount(sourceAmount);
        setAmountInput(formatNumber(sourceAmount));
      }
    } else if (inputValue.trim() === "") {
      setAmount(0);
      setMadAmount(0);
      setCentimeAmount(0);
      setFrancAmount(0);
      setAmountInput("");
      setMadInput("");
      setFrancInput("");
    }
  };

  const handleCentimeAmountBlur = () => {
    const value = normalizeNumber(centimeInput);
    if (value === null || value < 0) {
      setCentimeInput(formatNumber(centimeAmount));
      return;
    }
    setCentimeInput(formatNumber(parseFloat(value.toFixed(2))));
  };

  const handleFrancAmountChange = (e) => {
    const inputValue = e.target.value;
    setFrancInput(inputValue);
    setLastEditedField("franc");

    const value = normalizeNumber(inputValue);
    if (value !== null && value >= 0) {
      const mad = value / 100;
      const madRounded = parseFloat(mad.toFixed(2));
      const centimeRounded = parseFloat((madRounded * 20).toFixed(2));
      const francRounded = parseFloat(value.toFixed(2));
      setMadAmount(madRounded);
      setCentimeAmount(centimeRounded);
      setFrancAmount(francRounded);
      setMadInput(formatNumber(madRounded));
      setCentimeInput(formatNumber(centimeRounded));

      if (exchangeRate && exchangeRate > 0) {
        const sourceAmount = parseFloat((madRounded / exchangeRate).toFixed(2));
        setAmount(sourceAmount);
        setAmountInput(formatNumber(sourceAmount));
      }
    } else if (inputValue.trim() === "") {
      setAmount(0);
      setMadAmount(0);
      setCentimeAmount(0);
      setFrancAmount(0);
      setAmountInput("");
      setMadInput("");
      setCentimeInput("");
    }
  };

  const handleFrancAmountBlur = () => {
    const value = normalizeNumber(francInput);
    if (value === null || value < 0) {
      setFrancInput(formatNumber(francAmount));
      return;
    }
    setFrancInput(formatNumber(parseFloat(value.toFixed(2))));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`app ${darkMode ? "dark-mode" : "light-mode"}`}
      dir={getDir()}
    >
      <div className="container">
        <div className="header">
          <div>
            <h1>{t("title")}</h1>
            <p className="subtitle">{t("subtitle")}</p>
          </div>
          <div className="controls">
            <button
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              title={t("darkMode")}
              aria-label={t("darkMode")}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <div className="converter-card">
          <div className="conversion-row">
            <div className="input-group">
              <label htmlFor="amount">
                {fromCurrency} {t("amount")}
              </label>
              <input
                id="amount"
                type="number"
                value={amountInput}
                onChange={handleSourceAmountChange}
                onBlur={handleSourceAmountBlur}
                placeholder={t("amount")}
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label htmlFor="currency">{t("fromCurrency")}</label>
              <select
                id="currency"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {customCurrencies[curr]?.name ?? curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="equals-separator">=</div>

          <div className="conversion-row">
            <div className="input-group">
              <label htmlFor="madAmount">{t("madAmount")}</label>
              <input
                id="madAmount"
                type="number"
                value={madInput}
                onChange={handleMadAmountChange}
                onBlur={handleMadAmountBlur}
                placeholder="MAD"
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label htmlFor="centimeAmount">{t("centimeAmount")}</label>
              <input
                id="centimeAmount"
                type="number"
                value={centimeInput}
                onChange={handleCentimeAmountChange}
                onBlur={handleCentimeAmountBlur}
                placeholder={t("centimeAmount")}
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label htmlFor="francAmount">{t("francAmount")}</label>
              <input
                id="francAmount"
                type="number"
                value={francInput}
                onChange={handleFrancAmountChange}
                onBlur={handleFrancAmountBlur}
                placeholder={t("francAmount")}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {loading && <p className="loading">{t("loadingExchangeRate")}</p>}
          {error && <p className="error">{error}</p>}
          {exchangeRate && !loading && (
            <p className="exchange-rate">
              {t("exchangeRateInfo")
                .replace("{currency}", fromCurrency)
                .replace("{rate}", exchangeRate)}
            </p>
          )}
        </div>

        <div className="info">
          <output className="info-output">{t("infoText")}</output>
        </div>
      </div>
    </div>
  );
}

export default App;
