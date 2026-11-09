async function testRates() {
  const [vehiclesRes, pricelistRes] = await Promise.all([
    fetch('https://custoworks-car-rental.onrender.com/api/vehicles').then((r) => r.json()),
    fetch('https://custoworks-car-rental.onrender.com/api/pricing/pricelist').then((r) => r.json()),
  ]);

  const vehicles = vehiclesRes.data;
  const destinations = pricelistRes.destinations;
  const rateGuideRates = pricelistRes.rates;

  const formatTier = (rList: any[]): string => {
    const amounts = rList.map((r) => Number(r.amount)).filter((a) => !isNaN(a) && a > 0);
    if (amounts.length === 0) return '-';
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min === max) return `₱${Math.round(min).toLocaleString('en-PH')}`;
    return `₱${Math.round(min).toLocaleString('en-PH')} - ₱${Math.round(max).toLocaleString('en-PH')}`;
  };

  console.log('DESTINATION | SEDAN (12H) | SEDAN (24H) | SUV/MPV (12H) | SUV/MPV (24H) | VAN NV350 (WITH DRIVER)');
  for (const d of destinations) {
    // Sedans
    const sedanIds = vehicles.filter((v: any) => v.category === 'SEDAN').map((v: any) => v.id);
    const sedan12 = rateGuideRates.filter(
      (r: any) => sedanIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12' && r.amount != null
    );
    const sedan24 = rateGuideRates.filter(
      (r: any) => sedanIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24' && r.amount != null
    );

    // SUV / MPV
    const suvIds = vehicles.filter((v: any) => v.category === 'SUV_MPV').map((v: any) => v.id);
    const suv12 = rateGuideRates.filter(
      (r: any) => suvIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12' && r.amount != null
    );
    const suv24 = rateGuideRates.filter(
      (r: any) => suvIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24' && r.amount != null
    );

    // Van NV350
    const vanIds = vehicles.filter((v: any) => v.category === 'VAN').map((v: any) => v.id);
    const van12 = rateGuideRates.filter(
      (r: any) => vanIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_12' && r.amount != null
    );
    const van24 = rateGuideRates.filter(
      (r: any) => vanIds.includes(r.vehicleId) && r.destinationId === d.id && r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_24' && r.amount != null
    );

    const v12Amounts = van12.map((r: any) => Number(r.amount)).filter((a: any) => !isNaN(a) && a > 0);
    const v24Amounts = van24.map((r: any) => Number(r.amount)).filter((a: any) => !isNaN(a) && a > 0);
    const v12 = v12Amounts.length > 0 ? Math.min(...v12Amounts) : null;
    const v24 = v24Amounts.length > 0 ? Math.min(...v24Amounts) : null;

    let vanText = '-';
    if (v12 && v24) {
      vanText = `₱${Math.round(v12).toLocaleString('en-PH')} (12h) / ₱${Math.round(v24).toLocaleString('en-PH')} (24h)`;
    } else if (v24) {
      vanText = `₱${Math.round(v24).toLocaleString('en-PH')} (24h)`;
    } else if (v12) {
      vanText = `₱${Math.round(v12).toLocaleString('en-PH')} (12h)`;
    }

    console.log(`${d.name.padEnd(20)} | ${formatTier(sedan12).padEnd(10)} | ${formatTier(sedan24).padEnd(10)} | ${formatTier(suv12).padEnd(15)} | ${formatTier(suv24).padEnd(15)} | ${vanText}`);
  }
}

testRates();
