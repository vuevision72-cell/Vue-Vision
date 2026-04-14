
export default function ReturnsPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl mb-8">Return & Refund Policy</h1>
        <div className="space-y-6 text-muted-foreground">
            <p>At Zeno Pure Vision, we strive to ensure your satisfaction. This policy outlines the procedures for returns and refunds.</p>

            <h2 className="font-headline text-2xl pt-4">Return Policy</h2>
            <p>Zeno Pure Vision offers a 14-day return policy for most items. If you are not satisfied with your purchase, you may return it within 14 days of the delivery date for a refund or exchange, subject to the conditions below.</p>
            <ul className="list-disc list-inside space-y-2">
                <li>Products must be returned in their original, unworn, and undamaged condition.</li>
                <li>All original packaging, including cases, cleaning cloths, and any accessories, must be included.</li>
                <li>Prescription lenses are custom-made and are therefore non-refundable. However, if there is a manufacturing defect, we will replace the lenses at no cost.</li>
                <li>For damaged items, a clear, unedited unboxing video is mandatory. Return requests for damaged goods without a valid video will be rejected.</li>
            </ul>

            <h2 className="font-headline text-2xl pt-4">How to Initiate a Return</h2>
            <p>To initiate a return, please contact our support team via WhatsApp with your order number and the reason for the return. Our team will guide you through the process.</p>
            
            <h2 className="font-headline text-2xl pt-4">Refunds</h2>
            <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 7-10 business days.</p>
            <p>Please note that shipping costs are non-refundable. If you receive a refund, the cost of return shipping may be deducted from your refund.</p>

            <h2 className="font-headline text-2xl pt-4">Exchanges</h2>
            <p>We only replace items if they are defective or damaged. If you need to exchange it for the same item, contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
