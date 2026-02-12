'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { initializePaystackCheckout } from '@/actions/billing.actions';

const plans = {
  pro: {
    name: 'Pro Plan',
    price: 15,
    description: 'Unlimited group meetings, cloud recording, and more.',
  },
  business: {
    name: 'Business Plan',
    price: 35,
    description: 'For scaling organizations with advanced needs.',
  },
};

export default function CheckoutPage({ params }: { params: { plan: string } }) {
  const planKey = params.plan as keyof typeof plans;
  const plan = plans[planKey];
  const router = useRouter();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'paypal'>('paystack');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-black dark:text-white">
        <h1 className="text-2xl font-bold">Plan not found</h1>
        <Button onClick={() => router.push('/pricing')} className="mt-4">
          Go back to pricing
        </Button>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!email || !name) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'paystack') {
        const { authorization_url } = await initializePaystackCheckout({
          amountUsd: plan.price,
          planKey: planKey,
          name,
          email,
        });
        window.location.href = authorization_url;
        return;
      }
      toast({
        title: 'PayPal not configured',
        description: 'Please choose Paystack for now.',
      });
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center py-20 px-4 text-black dark:text-white min-h-screen">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Order Summary */}
        <div className="bg-white dark:bg-dark-1 p-8 rounded-2xl border border-gray-200 dark:border-dark-3 h-fit">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
            </div>
            <span className="text-xl font-bold">${plan.price}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>${plan.price}/month</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  type="text" 
                  id="name" 
                  placeholder="John Doe" 
                  className="bg-white dark:bg-dark-2 border-gray-200 dark:border-dark-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  type="email" 
                  id="email" 
                  placeholder="john@example.com" 
                  className="bg-white dark:bg-dark-2 border-gray-200 dark:border-dark-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            <RadioGroup defaultValue="paystack" onValueChange={(v) => setPaymentMethod(v as 'paystack' | 'paypal')}>
              <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paystack' ? 'border-blue-1 bg-blue-50 dark:bg-dark-3' : 'border-gray-200 dark:border-dark-3'}`}>
                <RadioGroupItem value="paystack" id="paystack" />
                <Label htmlFor="paystack" className="flex-1 cursor-pointer flex items-center justify-between">
                  <span>Paystack (Naira Cards)</span>
                  <div className="flex gap-2">
                     {/* Placeholder for Paystack Logo or Card Icons */}
                     <CreditCard size={20} />
                  </div>
                </Label>
              </div>
              <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-blue-1 bg-blue-50 dark:bg-dark-3' : 'border-gray-200 dark:border-dark-3'}`}>
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex-1 cursor-pointer flex items-center justify-between">
                  <span>PayPal (International)</span>
                  {/* Placeholder for PayPal Logo */}
                  <span className="font-bold text-blue-800 italic">PayPal</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            className="w-full py-6 text-lg bg-blue-1 hover:bg-blue-700 text-white rounded-xl"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${plan.price}`
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            By clicking &quot;Pay&quot;, you agree to our Terms of Service and Privacy Policy.
            <br />
            (Note: This is a demo payment flow)
          </p>
        </div>
      </div>
    </section>
  );
}
