async function testRates() {
  const [vehiclesRes, pricelistRes] = await Promise.all([
    fetch('https://custoworks-car-rental.onrender.com/api/vehicles').then((r) => r.json()),
    fetch('https://custoworks-car-rental.onrender.com/api/pricing/pricelist').then((r) => r.json()),
  ]);

  const vehicles = vehiclesRes.data;
  const destinations = pricelistRes.destinations;
  const rateGuideRates = pricelistRes.rates;

  const nagaDest = destinations.find((d: any) => d.slug === 'naga-city');
  console.log('Naga Destination ID:', nagaDest?.id);

  const sedanIds = vehicles.filter((v: any) => v.category === 'SEDAN').map((v: any) => v.id);
  const sedan12 = rateGuideRates.filter(
    (r: any) => sedanIds.includes(r.vehicleId) && r.destinationId === nagaDest.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12' && r.amount != null
  );
  const sedan24 = rateGuideRates.filter(
    (r: any) => sedanIds.includes(r.vehicleId) && r.destinationId === nagaDest.id && r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24' && r.amount != null
  );

  const formatTier = (rList: any[]): string => {
    const amounts = rList.map((r) => Number(r.amount)).filter((a) => !isNaN(a) && a > 0);
    if (amounts.length === 0) return '-';
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min === max) return `₱${Math.round(min).toLocaleString('en-PH')}`;
    return `₱${Math.round(min).toLocaleString('en-PH')} - ₱${Math.round(max).toLocaleString('en-PH')}`;
  };

  console.log('--- TABLE ROW FOR NAGA CITY ---');
  console.log('Sedan (12h):', formatTier(sedan12));
  console.log('Sedan (24h):', formatTier(sedan24));
}

testRates();
