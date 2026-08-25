'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, Play, BookOpen, Award, Lightbulb, Settings } from 'lucide-react'

const tutorials = [
  {
    id: 'getting-started',
    title: 'Getting Started with Vendari',
    icon: <Play className="w-6 h-6" />,
    content: [
      {
        step: 1,
        title: 'Complete Your Business Setup',
        description:
          'After logging in, you\'ll be taken to the business setup page. Fill in all your business details including name, contact information, and business type. This information is crucial for proper business tracking.',
      },
      {
        step: 2,
        title: 'Add Your First Product to Inventory',
        description:
          'Go to the Inventory section and click "Add Item". Enter your product details including name, code, category, quantity in stock, reorder level, cost price, and selling price. This helps track your stock levels.',
      },
      {
        step: 3,
        title: 'Record Your First Sale',
        description:
          'Navigate to the Sales section and click "Record Sale". Enter the product name, quantity sold, unit price, and payment method. The system automatically calculates the total amount.',
      },
      {
        step: 4,
        title: 'Track Your Expenses',
        description:
          'In the Reports section, click "Add Expense" to record your business expenses. Categorize them properly (Rent, Utilities, Salaries, etc.) for accurate profit & loss analysis.',
      },
      {
        step: 5,
        title: 'Monitor Your Dashboard',
        description:
          'Visit the main dashboard regularly to see your sales trends, profit margins, and inventory alerts. This gives you a quick overview of your business performance.',
      },
    ],
  },
  {
    id: 'features',
    title: 'Understanding Vendari Features',
    icon: <Award className="w-6 h-6" />,
    content: [
      {
        step: 1,
        title: 'Dashboard Overview',
        description:
          'The main dashboard shows your key business metrics including total sales, net profit, inventory items, and total expenses. Charts display sales trends and expense distribution for quick insights.',
      },
      {
        step: 2,
        title: 'Sales Management',
        description:
          'Track every transaction with detailed information. The sales page shows sales trends over time, allows filtering by date range, and displays payment methods. Use this to analyze your selling patterns.',
      },
      {
        step: 3,
        title: 'Inventory Management',
        description:
          'Manage all your products in one place. Set reorder levels for automatic stock alerts, track supplier information, and monitor profitability per product. Low stock items are highlighted in red.',
      },
      {
        step: 4,
        title: 'Profit & Loss Reports',
        description:
          'Generate comprehensive financial reports comparing your revenue against expenses. View daily revenue vs expenses charts and categorized expense breakdowns to understand your spending patterns.',
      },
      {
        step: 5,
        title: 'Smart Alerts',
        description:
          'Vendari automatically alerts you when products fall below reorder levels. These alerts appear on your dashboard and inventory page to ensure you never run out of stock unexpectedly.',
      },
    ],
  },
  {
    id: 'tips',
    title: 'Best Practices & Tips',
    icon: <Lightbulb className="w-6 h-6" />,
    content: [
      {
        step: 1,
        title: 'Keep Records Updated Daily',
        description:
          'Record sales and expenses daily for accurate real-time insights. The sooner you log transactions, the more accurate your reports will be.',
      },
      {
        step: 2,
        title: 'Set Realistic Reorder Levels',
        description:
          'Based on your sales velocity and supplier delivery time, set appropriate reorder levels. This prevents stockouts and excess inventory.',
      },
      {
        step: 3,
        title: 'Categorize Expenses Properly',
        description:
          'Use consistent expense categories to get meaningful reports. This helps you identify cost-saving opportunities and understand your spending breakdown.',
      },
      {
        step: 4,
        title: 'Review Reports Regularly',
        description:
          'Check your profit & loss reports weekly to identify trends. Look for ways to increase revenue or reduce expenses based on the data.',
      },
      {
        step: 5,
        title: 'Monitor Inventory Turnover',
        description:
          'Products that sell quickly have good turnover. Focus on products with high turnover and consider removing those that move slowly.',
      },
      {
        step: 6,
        title: 'Use Payment Methods Tracking',
        description:
          'Track different payment methods to understand customer preferences and manage cash flow. This is especially important for credit and transfer sales.',
      },
    ],
  },
]

const faqs = [
  {
    question: 'How often should I update my inventory?',
    answer:
      'It\'s best to update inventory after each sale and when you receive new stock. For businesses with high transaction volumes, daily updates are recommended. This ensures your stock levels are always accurate.',
  },
  {
    question: 'Can I edit past transactions?',
    answer:
      'While you can\'t edit historical transactions to maintain data integrity, you can record adjustments as new transactions. This keeps an audit trail of all your business activities.',
  },
  {
    question: 'What if I need a specific date range report?',
    answer:
      'The Reports section allows you to select custom date ranges. Simply set your preferred start and end dates to generate reports for any period you need.',
  },
  {
    question: 'How is profit calculated?',
    answer:
      'Profit = Total Sales Revenue - Total Expenses. The profit margin percentage is calculated as (Profit / Total Sales) × 100. This gives you a clear picture of your business profitability.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'You can record sales through Cash, Card transfers, Bank transfers, and Cheques. Select the appropriate method when recording each transaction.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, all your business data is encrypted and securely stored. Access is protected by your account credentials, and your data is never shared with third parties.',
  },
  {
    question: 'Can I export my reports?',
    answer:
      'Currently, you can view and analyze reports directly in the platform. We\'re working on adding export functionality for future updates.',
  },
  {
    question: 'How do low stock alerts work?',
    answer:
      'When a product\'s quantity falls to or below the reorder level you set, it appears on the dashboard and inventory page with a low stock warning. This helps you maintain optimal inventory levels.',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-400" />
            Help & Tutorials
          </h1>
          <p className="text-slate-400 mt-2">Learn how to use Vendari effectively</p>
        </div>

        {/* Tutorials Section */}
        <div className="space-y-6 mb-12">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="bg-slate-800/50 border-slate-700 backdrop-blur">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="text-blue-400">{tutorial.icon}</div>
                <CardTitle className="text-white">{tutorial.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tutorial.content.map((item) => (
                    <div key={item.step} className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm">
                          {item.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-400" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-white hover:text-blue-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Quick Reference Card */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 border-blue-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-400" />
              Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-blue-300 font-semibold mb-3">Main Navigation</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <span className="text-white font-medium">Dashboard:</span> Overview of your business
                  </li>
                  <li>
                    <span className="text-white font-medium">Sales:</span> Record and track sales
                  </li>
                  <li>
                    <span className="text-white font-medium">Inventory:</span> Manage products
                  </li>
                  <li>
                    <span className="text-white font-medium">Reports:</span> Profit & loss analysis
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-3">Key Metrics</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <span className="text-white font-medium">Total Sales:</span> Sum of all revenue
                  </li>
                  <li>
                    <span className="text-white font-medium">Net Profit:</span> Revenue minus expenses
                  </li>
                  <li>
                    <span className="text-white font-medium">Profit Margin:</span> Profit as percentage of sales
                  </li>
                  <li>
                    <span className="text-white font-medium">Stock Level:</span> Current inventory quantity
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
