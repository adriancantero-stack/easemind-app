"""
Script to create Stripe products and prices for EaseMind
Run this once to setup products in your Stripe account
"""
import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def create_products():
    """Create all EaseMind Premium products and prices"""
    
    products_created = []
    
    try:
        # 1. Premium Monthly BRL (R$ 29,90/mês)
        print("Creating Premium Monthly BRL...")
        product_monthly_brl = stripe.Product.create(
            name="EaseMind Premium - Mensal",
            description="Plano Premium mensal com chat e sessões ilimitadas",
            metadata={
                "plan_type": "premium",
                "billing_period": "monthly",
                "currency": "brl"
            }
        )
        
        price_monthly_brl = stripe.Price.create(
            product=product_monthly_brl.id,
            unit_amount=2990,  # R$ 29,90 in cents
            currency="brl",
            recurring={"interval": "month", "trial_period_days": 7}
        )
        
        products_created.append({
            "name": "Premium Monthly BRL",
            "product_id": product_monthly_brl.id,
            "price_id": price_monthly_brl.id,
            "amount": "R$ 29,90/mês"
        })
        
        # 2. Premium Yearly BRL (R$ 299,00/ano)
        print("Creating Premium Yearly BRL...")
        product_yearly_brl = stripe.Product.create(
            name="EaseMind Premium - Anual",
            description="Plano Premium anual com chat e sessões ilimitadas (2 meses grátis)",
            metadata={
                "plan_type": "premium",
                "billing_period": "yearly",
                "currency": "brl"
            }
        )
        
        price_yearly_brl = stripe.Price.create(
            product=product_yearly_brl.id,
            unit_amount=29900,  # R$ 299,00 in cents
            currency="brl",
            recurring={"interval": "year", "trial_period_days": 7}
        )
        
        products_created.append({
            "name": "Premium Yearly BRL",
            "product_id": product_yearly_brl.id,
            "price_id": price_yearly_brl.id,
            "amount": "R$ 299,00/ano"
        })
        
        # 3. Premium Monthly USD ($7.99/month)
        print("Creating Premium Monthly USD...")
        product_monthly_usd = stripe.Product.create(
            name="EaseMind Premium - Monthly",
            description="Premium plan with unlimited chat and sessions",
            metadata={
                "plan_type": "premium",
                "billing_period": "monthly",
                "currency": "usd"
            }
        )
        
        price_monthly_usd = stripe.Price.create(
            product=product_monthly_usd.id,
            unit_amount=799,  # $7.99 in cents
            currency="usd",
            recurring={"interval": "month", "trial_period_days": 7}
        )
        
        products_created.append({
            "name": "Premium Monthly USD",
            "product_id": product_monthly_usd.id,
            "price_id": price_monthly_usd.id,
            "amount": "$7.99/month"
        })
        
        # 4. Premium Yearly USD ($79.90/year)
        print("Creating Premium Yearly USD...")
        product_yearly_usd = stripe.Product.create(
            name="EaseMind Premium - Yearly",
            description="Premium yearly plan with unlimited chat and sessions (2 months free)",
            metadata={
                "plan_type": "premium",
                "billing_period": "yearly",
                "currency": "usd"
            }
        )
        
        price_yearly_usd = stripe.Price.create(
            product=product_yearly_usd.id,
            unit_amount=7990,  # $79.90 in cents
            currency="usd",
            recurring={"interval": "year", "trial_period_days": 7}
        )
        
        products_created.append({
            "name": "Premium Yearly USD",
            "product_id": product_yearly_usd.id,
            "price_id": price_yearly_usd.id,
            "amount": "$79.90/year"
        })
        
        # Print summary
        print("\n" + "="*60)
        print("✅ PRODUCTS CREATED SUCCESSFULLY!")
        print("="*60)
        
        for product in products_created:
            print(f"\n{product['name']}:")
            print(f"  Product ID: {product['product_id']}")
            print(f"  Price ID: {product['price_id']}")
            print(f"  Amount: {product['amount']}")
        
        print("\n" + "="*60)
        print("📝 ADD THESE PRICE IDs TO YOUR .env FILE:")
        print("="*60)
        print(f"STRIPE_PRICE_MONTHLY_BRL={products_created[0]['price_id']}")
        print(f"STRIPE_PRICE_YEARLY_BRL={products_created[1]['price_id']}")
        print(f"STRIPE_PRICE_MONTHLY_USD={products_created[2]['price_id']}")
        print(f"STRIPE_PRICE_YEARLY_USD={products_created[3]['price_id']}")
        print("="*60)
        
        return products_created
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe Error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("Creating EaseMind Premium products in Stripe...")
    print("Using Stripe Secret Key:", os.getenv('STRIPE_SECRET_KEY')[:20] + "...")
    print()
    
    create_products()
