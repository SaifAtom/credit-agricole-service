const axios = require('axios');
const querystring = require('querystring');

module.exports = {
    async checkout(ctx) {
        try {      
            const data = ctx.request.body;
            if (!data) {
                return ctx.badRequest("No data received");
            }

            // Find the website
            const websiteData = await strapi.entityService.findMany('api::website.website', {
                filters: {
                    websiteName: {
                        $eq: data.websiteName
                    }
                }
            });

            if (!websiteData || websiteData.length === 0) {
                return ctx.notFound("Website not found");
            }

            // Format data
            const eTransactionData = {
                pbx_site: websiteData[0].numPaybox,
                pbx_rang: websiteData[0].rang,
                pbx_identifiant: websiteData[0].identifiant,
                pbx_total: data.totalAmount,
                pbx_cmd: data.orderRef,
                pbx_porteur: data.email,
                pbx_prenom_fact: data.firstName,
                pbx_nom_fact: data.lastName,
                pbx_adresse1_fact: data.address1,
                pbx_adresse2_fact: data.address2 || '',
                pbx_zipcode_fact: data.zipCode,
                pbx_country_fact: '250',
                pbx_mobile_phone: data.mobilePhone,
                pbx_mobile_country_code: data.mobileCountryCode,
                pbx_nb_produit: data.numProducts,
                pbx_repondre_a: websiteData[0].url_repondre,
                pbx_retour: websiteData[0].url_retoure,
                pbx_effectue: `http://localhost:3000/payment/success`,
                pbx_annule: `http://localhost:3000/payment/cancelled`,
                pbx_refuse: `http://localhost:3000/payment/refused`,
                hmac: websiteData[0].hmac
            };
            console.log("eTransactionData=======================>", eTransactionData)
            // Send data to PHP script
            const phpResponse = await axios.post(
                websiteData[0].url_php,
                querystring.stringify(eTransactionData),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }
            );

            return ctx.send({
                status: 'success',
                paymentForm: phpResponse.data,
                reference: data.orderRef
            });

        } catch (error) {
            console.error('Payment processing error:', error);
            return ctx.badRequest({
                status: 'error',
                message: error.message,
                details: error.response?.data
            });
        }
    }
};