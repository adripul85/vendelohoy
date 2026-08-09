import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    type?: string;
    name?: string;
    image?: string;
    url?: string;
}

export default function SEO({ 
    title, 
    description, 
    type = 'website', 
    name = 'De Oportunidades', 
    image, 
    url 
}: SEOProps) {
    const defaultTitle = "De Oportunidades - Compra y Venta Segura";
    const defaultDescription = "El marketplace más seguro de Argentina. Compra y vende productos con protección de Escrow, verificación de identidad y comisiones justas.";
    const defaultImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"; // A premium hero image

    const seoTitle = title ? `${title} | ${name}` : defaultTitle;
    const seoDescription = description || defaultDescription;
    const seoImage = image || defaultImage;
    const seoUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{seoTitle}</title>
            <meta name='description' content={seoDescription} />
            
            {/* Open Graph / Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDescription} />
            <meta property="og:image" content={seoImage} />
            <meta property="og:url" content={seoUrl} />
            <meta property="og:site_name" content={name} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seoTitle} />
            <meta name="twitter:description" content={seoDescription} />
            <meta name="twitter:image" content={seoImage} />
        </Helmet>
    );
}
